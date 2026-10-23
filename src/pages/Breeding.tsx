import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/db';

export const Breeding: React.FC<{ initialSnakeId?: string }> = ({ initialSnakeId }) => {
  const [activeTab, setActiveTab] = useState<'pedigree' | 'simulator'>('pedigree');
  const [snakes, setSnakes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pedigree State
  const [selectedSnakeId, setSelectedSnakeId] = useState<number | ''>('');

  // Simulator States
  const [selectedSireId, setSelectedSireId] = useState<number | ''>('');
  const [selectedDamId, setSelectedDamId] = useState<number | ''>('');
  const [simulationResult, setSimulationResult] = useState<any | null>(null);

  // Load snakes on mount
  useEffect(() => {
    db.getSnakes()
      .then(res => {
        setSnakes(res);
        if (res.length > 0) {
          if (initialSnakeId) {
            setSelectedSnakeId(Number(initialSnakeId));
          } else {
            // Default select the first snake for pedigree view
            setSelectedSnakeId(res[0].id);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading specimens for breeding module:', err);
        setLoading(false);
      });
  }, []);

  // Update selected snake when initialSnakeId changes
  useEffect(() => {
    if (initialSnakeId && snakes.length > 0) {
      setSelectedSnakeId(Number(initialSnakeId));
      setActiveTab('pedigree');
    }
  }, [initialSnakeId, snakes]);

  // Create lookup map for client-side tree traversal
  const snakeMap = useMemo(() => {
    return new Map<number, any>(snakes.map(s => [s.id, s]));
  }, [snakes]);

  // Options for Dropdowns
  const sireOptions = useMemo(() => snakes.filter(s => s.detail?.gender === 'male' || s.detail?.gender === 'unsexed'), [snakes]);
  const damOptions = useMemo(() => snakes.filter(s => s.detail?.gender === 'female' || s.detail?.gender === 'unsexed'), [snakes]);

  // ----------------------------------------------------
  // Pedigree Tree Resolver (3 Generations)
  // ----------------------------------------------------
  const pedigreeTree = useMemo(() => {
    if (!selectedSnakeId || snakes.length === 0) return null;
    
    const proband = snakeMap.get(Number(selectedSnakeId));
    if (!proband) return null;

    const getParent = (id: number | null | undefined) => {
      if (id === null || id === undefined) return null;
      return snakeMap.get(id) || null;
    };

    // 1st Generation (Parents)
    const sire = getParent(proband.sire_id);
    const dam = getParent(proband.dam_id);

    // 2nd Generation (Grandparents)
    const sireSire = sire ? getParent(sire.sire_id) : null;
    const sireDam = sire ? getParent(sire.dam_id) : null;
    const damSire = dam ? getParent(dam.sire_id) : null;
    const damDam = dam ? getParent(dam.dam_id) : null;

    return {
      proband,
      sire,
      dam,
      sireSire,
      sireDam,
      damSire,
      damDam
    };
  }, [selectedSnakeId, snakes, snakeMap]);

  // Helper to draw a node card
  const renderNode = (snake: any, title: string, genderBadge: string) => {
    if (!snake) {
      return (
        <div className="bg-surface-container border border-outline-variant/50 rounded-xl p-4 flex flex-col justify-center items-center text-center opacity-50 min-h-[90px]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">{title}</span>
          <span className="text-body-sm text-on-surface-variant italic">Unknown / Wild</span>
        </div>
      );
    }
    return (
      <div 
        onClick={() => setSelectedSnakeId(snake.id)}
        className="bg-white border border-outline-variant hover:border-primary rounded-xl p-4 flex gap-3 items-center cursor-pointer shadow-sm hover:shadow transition-all active:scale-[0.98] text-left min-h-[90px]"
      >
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0">
          <img src={snake.gallery_image_url || ''} className="w-full h-full object-cover" alt="" />
        </div>
        <div className="flex-grow overflow-hidden">
          <div className="flex justify-between items-center gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{title}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${genderBadge === '♂' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>{genderBadge}</span>
          </div>
          <h5 className="font-display font-bold text-body-md text-on-surface truncate">{snake.name}</h5>
          <p className="text-[11px] text-on-surface-variant truncate">{snake.morph || 'Normal'}</p>
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // Genetic Simulator Handler
  // ----------------------------------------------------
  const handleSimulate = () => {
    if (!selectedSireId || !selectedDamId) return;
    
    const sire = snakeMap.get(Number(selectedSireId));
    const dam = snakeMap.get(Number(selectedDamId));
    if (!sire || !dam) return;

    // 1. Inbreeding Check
    const getAncestors = (snakeId: number | null | undefined, visited = new Set<number>()): Set<number> => {
      if (snakeId === null || snakeId === undefined) return visited;
      const s = snakeMap.get(snakeId);
      if (s) {
        visited.add(s.id);
        getAncestors(s.sire_id, visited);
        getAncestors(s.dam_id, visited);
      }
      return visited;
    };

    const sireAncestors = getAncestors(sire.id);
    const damAncestors = getAncestors(dam.id);
    
    // Find intersection
    const commonAncestors: any[] = [];
    sireAncestors.forEach(id => {
      if (damAncestors.has(id)) {
        commonAncestors.push(snakeMap.get(id));
      }
    });

    // Calculate Inbreeding Coefficient approximation
    let inbreedingCoeff = 0;
    if (sire.id === dam.id) {
      inbreedingCoeff = 100; // Same snake (cloned/asexual - theoretically)
    } else {
      // Check relation depth
      const shareParents = (sire.sire_id === dam.sire_id && sire.sire_id !== null) || (sire.dam_id === dam.dam_id && sire.dam_id !== null);
      if (shareParents) {
        inbreedingCoeff = 25.0; // Half siblings or full siblings
      } else {
        // Grandparent match
        commonAncestors.forEach(() => {
          inbreedingCoeff += 6.25;
        });
      }
    }

    // 2. Parse Morph & Genetic Combination
    // Dominant & Co-dominant list simulation
    const codomList = ['pastel', 'butter', 'mojave', 'enchi', 'yellowbelly', 'spider', 'leopard', 'fire'];
    // Recessive list simulation
    const recessiveList = ['clown', 'pied', 'albino', 'ghost', 'axanthic', 'hypo'];

    const getGenes = (morphStr: string) => {
      const parts = morphStr.toLowerCase().split(/[\s+]+/);
      const genes = {
        codom: [] as string[],
        recessive: [] as string[]
      };
      parts.forEach(part => {
        if (codomList.includes(part)) genes.codom.push(part);
        if (recessiveList.includes(part)) genes.recessive.push(part);
      });
      return genes;
    };

    const sireGenes = getGenes(sire.morph || '');
    const damGenes = getGenes(dam.morph || '');

    // Co-dominant combinations (50% chance to pass each gene)
    const allCodoms = Array.from(new Set([...sireGenes.codom, ...damGenes.codom]));
    const allRecessives = Array.from(new Set([...sireGenes.recessive, ...damGenes.recessive]));

    // Generate simulated phenotypes
    // 1st combination: All co-doms passed + Het recessives (High tier)
    const upperMorphParts: string[] = [];
    allCodoms.forEach(g => {
      if (Math.random() > 0.3) upperMorphParts.push(g); // 70% chance to pass co-doms in combined clutch
    });
    allRecessives.forEach(g => {
      upperMorphParts.push(`Het ${g}`);
    });
    const upperMorphName = upperMorphParts.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Normal';

    // 2nd combination: Partial co-doms passed
    const midMorphParts: string[] = [];
    allCodoms.slice(0, Math.ceil(allCodoms.length / 2)).forEach(g => {
      midMorphParts.push(g);
    });
    allRecessives.forEach(g => {
      midMorphParts.push(`Het ${g}`);
    });
    const midMorphName = midMorphParts.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Normal';

    // 3rd combination: Normal het
    const lowMorphParts: string[] = [];
    allRecessives.forEach(g => {
      lowMorphParts.push(`Het ${g}`);
    });
    const lowMorphName = lowMorphParts.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Normal';

    // Deduplicate and output probability estimates
    const predictedMorphs = [
      { morph: upperMorphName, probability: 25, tier: 'Premium Phenotype' },
      { morph: midMorphName, probability: 50, tier: 'Standard Phenotype' },
      { morph: lowMorphName, probability: 25, tier: 'Wild-Type Carrier' }
    ];

    setSimulationResult({
      sire,
      dam,
      commonAncestors,
      inbreedingCoeff,
      predictedMorphs
    });
  };

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 mb-20 text-left flex-grow">
      
      {/* Page Header */}
      <div className="mb-10 flex justify-between items-end border-b border-outline-variant pb-6">
        <div>
          <h2 className="font-display text-headline-lg text-primary font-bold mb-2">Breeding Center</h2>
          <p className="font-body-md text-on-surface-variant max-w-2xl">
            Explore pedigree trees and run breeding simulators to predict offspring morph outcomes and verify bloodline integrity.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-surface-container-low p-1.5 rounded-xl border border-outline-variant">
          <button 
            onClick={() => setActiveTab('pedigree')}
            className={`px-5 py-2.5 rounded-lg font-label-sm font-bold transition-all ${
              activeTab === 'pedigree' 
                ? 'bg-primary text-on-primary shadow-sm' 
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Pedigree Explorer
          </button>
          <button 
            onClick={() => setActiveTab('simulator')}
            className={`px-5 py-2.5 rounded-lg font-label-sm font-bold transition-all ${
              activeTab === 'simulator' 
                ? 'bg-primary text-on-primary shadow-sm' 
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            Genetic Simulator
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined text-4xl animate-spin text-primary">sync</span>
        </div>
      ) : snakes.length === 0 ? (
        <div className="bg-white border border-outline-variant rounded-2xl p-12 text-center text-on-surface-variant italic">
          No specimens found in the database. Please add snakes in the admin panel first.
        </div>
      ) : (
        <>
          {/* TAB 1: PEDIGREE EXPLORER */}
          {activeTab === 'pedigree' && pedigreeTree && (
            <div className="space-y-8">
              
              {/* Select Specimen Dropdown */}
              <div className="bg-white border border-outline-variant p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center gap-4 max-w-xl">
                <div className="flex-grow">
                  <label className="block text-on-surface font-label-sm uppercase tracking-wider mb-2 font-bold">Select Specimen to Trace</label>
                  <select 
                    value={selectedSnakeId}
                    onChange={(e) => setSelectedSnakeId(Number(e.target.value))}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 outline-none text-body-md focus:border-primary"
                  >
                    {snakes.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.species} • {s.morph || 'Normal'})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pedigree visual tree diagram */}
              <div className="bg-white border border-outline-variant rounded-2xl p-8 shadow-sm overflow-x-auto">
                <h3 className="font-display text-headline-md text-primary font-bold mb-8 text-center">
                  Pedigree Tree: {pedigreeTree.proband.name}
                </h3>
                
                {/* Visual Node Grid */}
                <div className="grid grid-cols-3 gap-y-8 gap-x-12 min-w-[700px] relative py-8 px-4">
                  
                  {/* GENERATION 3: GRANDPARENTS */}
                  <div className="flex flex-col justify-around gap-6">
                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">Sire's Sire (ปู่)</span>
                      {renderNode(pedigreeTree.sireSire, 'Paternal G-Sire', '♂')}
                    </div>
                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">Sire's Dam (ย่า)</span>
                      {renderNode(pedigreeTree.sireDam, 'Paternal G-Dam', '♀')}
                    </div>
                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">Dam's Sire (ตา)</span>
                      {renderNode(pedigreeTree.damSire, 'Maternal G-Sire', '♂')}
                    </div>
                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">Dam's Dam (ยาย)</span>
                      {renderNode(pedigreeTree.damDam, 'Maternal G-Dam', '♀')}
                    </div>
                  </div>

                  {/* GENERATION 2: PARENTS */}
                  <div className="flex flex-col justify-around gap-12 relative">
                    
                    {/* Visual Connector Lines */}
                    <div className="absolute inset-y-0 -left-6 w-6 border-y-2 border-r-2 border-outline-variant/30 rounded-r-lg" style={{ height: '50%', top: '12%' }}></div>
                    <div className="absolute inset-y-0 -left-6 w-6 border-y-2 border-r-2 border-outline-variant/30 rounded-r-lg" style={{ height: '50%', top: '62%' }}></div>

                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">Sire (พ่อ)</span>
                      {renderNode(pedigreeTree.sire, 'Sire Parent', '♂')}
                    </div>
                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest pl-1">Dam (แม่)</span>
                      {renderNode(pedigreeTree.dam, 'Dam Parent', '♀')}
                    </div>
                  </div>

                  {/* GENERATION 1: PROBAND */}
                  <div className="flex flex-col justify-center relative">
                    {/* Visual Connector Lines */}
                    <div className="absolute inset-y-0 -left-6 w-6 border-y-2 border-r-2 border-outline-variant/30 rounded-r-lg" style={{ height: '44%', top: '28%' }}></div>

                    <div className="space-y-2 max-w-sm">
                      <span className="text-[9px] font-bold text-primary uppercase tracking-widest pl-1">Selected Specimen</span>
                      <div className="bg-primary text-on-primary rounded-xl p-5 border border-primary/20 shadow-md">
                        <div className="flex gap-4 items-center">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
                            <img src={pedigreeTree.proband.gallery_image_url || ''} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="bg-secondary-container/20 text-secondary-fixed text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                Proband
                              </span>
                              <span className="text-sm font-bold">
                                {pedigreeTree.proband.detail?.gender === 'male' ? '♂ (1.0)' : pedigreeTree.proband.detail?.gender === 'female' ? '♀ (0.1)' : 'Unsexed'}
                              </span>
                            </div>
                            <h4 className="font-display font-bold text-headline-sm text-white">{pedigreeTree.proband.name}</h4>
                            <p className="text-xs text-white/80 font-medium truncate max-w-[200px]">{pedigreeTree.proband.species} • {pedigreeTree.proband.morph || 'Normal'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PAIRING SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="space-y-8">
              
              {/* Simulator Input Panel */}
              <div className="bg-white border border-outline-variant p-6 rounded-2xl shadow-sm">
                <h3 className="font-display text-headline-md text-primary font-bold mb-6">Clutch Pairing Simulation</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-on-surface font-label-sm uppercase tracking-wider mb-2 font-bold text-left">Sire (Select Father ♂)</label>
                    <select 
                      value={selectedSireId}
                      onChange={(e) => setSelectedSireId(Number(e.target.value))}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 outline-none text-body-md focus:border-primary"
                    >
                      <option value="">Select male...</option>
                      {sireOptions.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.morph || 'Normal'})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-on-surface font-label-sm uppercase tracking-wider mb-2 font-bold text-left">Dam (Select Mother ♀)</label>
                    <select 
                      value={selectedDamId}
                      onChange={(e) => setSelectedDamId(Number(e.target.value))}
                      className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 outline-none text-body-md focus:border-primary"
                    >
                      <option value="">Select female...</option>
                      {damOptions.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.morph || 'Normal'})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button 
                  onClick={handleSimulate}
                  disabled={!selectedSireId || !selectedDamId}
                  className="bg-primary text-on-primary font-label-sm py-4 px-8 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/95 transition-colors active:scale-98 disabled:opacity-40 shadow-sm"
                >
                  <span className="material-symbols-outlined">science</span>
                  Run Genetic Simulation
                </button>
              </div>

              {/* Simulation Result Panels */}
              {simulationResult && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Left: Inbreeding Alert & Coefficient Box */}
                  <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <h4 className="font-display text-headline-sm text-primary font-bold mb-4">Breeding Compatibility</h4>
                      
                      {simulationResult.inbreedingCoeff > 0 ? (
                        <div className="space-y-4">
                          <div className="bg-error-container text-on-error-container p-4 rounded-xl border border-error/20">
                            <div className="flex gap-2 items-center mb-2 font-bold">
                              <span className="material-symbols-outlined text-error">warning</span>
                              <span>Inbreeding Detected!</span>
                            </div>
                            <p className="text-body-sm leading-relaxed">
                              These parents share ancestors in their genetic trees. Breeding them might increase homozygous recessive expression risks.
                            </p>
                          </div>
                          
                          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant">
                            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Inbreeding Coefficient</span>
                            <span className="font-display text-3xl font-extrabold text-error font-mono">{simulationResult.inbreedingCoeff.toFixed(2)}%</span>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">Shared Ancestors</span>
                            <div className="max-h-[120px] overflow-y-auto space-y-1">
                              {simulationResult.commonAncestors.map((a: any) => (
                                <div key={a.id} className="text-body-sm font-semibold text-primary">• {a.name} ({a.morph || 'Normal'})</div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-primary/10 text-primary p-4 rounded-xl border border-primary/20">
                            <div className="flex gap-2 items-center mb-1 font-bold">
                              <span className="material-symbols-outlined">check_circle</span>
                              <span>Ideal Pairing Match</span>
                            </div>
                            <p className="text-body-sm leading-relaxed">
                              No common ancestors found in 3 generations. This is a clean outcross pairing.
                            </p>
                          </div>
                          
                          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant">
                            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Inbreeding Coefficient</span>
                            <span className="font-display text-3xl font-extrabold text-primary font-mono">0.00%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Phenotype Punnett Grid Outcomes */}
                  <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm lg:col-span-2">
                    <h4 className="font-display text-headline-sm text-primary font-bold mb-4">Offspring Phenotype Probabilities</h4>
                    <p className="text-body-sm text-on-surface-variant mb-6">
                      Simulated Punnett square combination averages. Genetic inheritance outputs co-dominant genes and recessive heterozygotes.
                    </p>

                    <div className="space-y-4">
                      {simulationResult.predictedMorphs.map((o: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-surface-container-low border border-outline-variant rounded-xl">
                          <div className="text-left">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2.5 py-0.5 rounded-full mb-1 inline-block">
                              {o.tier}
                            </span>
                            <h5 className="font-display font-bold text-body-lg text-primary">{o.morph}</h5>
                          </div>
                          <div className="text-right">
                            <span className="font-display text-2xl font-extrabold text-primary font-mono">{o.probability}%</span>
                            <span className="text-[10px] text-on-surface-variant block uppercase font-bold">Probability</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}
        </>
      )}

    </main>
  );
};
