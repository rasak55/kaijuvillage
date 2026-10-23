import React, { useState } from 'react';
import { storage, db } from '../services/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const UploadSnakeDemo: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name) return alert('กรุณากรอกข้อมูลและเลือกไฟล์!');

    try {
      setUploading(true);

      // 1. ตั้งค่าตำแหน่งเก็บไฟล์ใน Firebase Storage (โฟลเดอร์ snakes/ชื่อไฟล์)
      const storageRef = ref(storage, `snakes/${Date.now()}_${file.name}`);
      
      // 2. เริ่มต้นอัปโหลดไฟล์
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // คำนวณเปอร์เซ็นต์ความคืบหน้า
          const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(Math.round(pct));
        },
        (error) => {
          console.error('Upload failed:', error);
          alert('อัปโหลดไฟล์ล้มเหลว: ' + error.message);
          setUploading(false);
        },
        async () => {
          // 3. เมื่ออัปโหลดเสร็จสมบูรณ์ ให้ขอ Download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // 4. บันทึกข้อมูลทั้งหมดลง Firestore ใน collection ชื่อ 'snakes'
          await addDoc(collection(db, 'snakes'), {
            name: name,
            species: species,
            imageUrl: downloadURL,
            createdAt: serverTimestamp(),
          });

          alert('อัปโหลดและบันทึกข้อมูลเรียบร้อยแล้ว!');
          
          // ล้างข้อมูลฟอร์ม
          setName('');
          setSpecies('');
          setFile(null);
          setProgress(0);
          setUploading(false);
        }
      );
    } catch (err: any) {
      console.error('Error:', err);
      alert('เกิดข้อผิดพลาด: ' + err.message);
      setUploading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-surface-variant rounded-lg shadow-md my-8">
      <h3 className="text-xl font-bold text-primary mb-4">ตัวอย่างหน้าอัปโหลดรูปภาพขึ้น Firebase</h3>
      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">ชื่อสัตว์เลี้ยง/งู: </label>
          <input 
            type="text"
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
            className="w-full p-2 border border-outline rounded bg-surface text-on-surface"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">สายพันธุ์ (Species): </label>
          <input 
            type="text"
            value={species} 
            onChange={(e) => setSpecies(e.target.value)} 
            className="w-full p-2 border border-outline rounded bg-surface text-on-surface"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-on-surface mb-1">เลือกไฟล์รูปภาพ: </label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            required 
            className="w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-on-primary hover:file:bg-primary-hover cursor-pointer"
          />
        </div>
        
        {uploading && (
          <div className="w-full bg-outline rounded-full h-2.5 dark:bg-gray-700">
            <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
            <p className="text-sm text-on-surface-variant mt-1 text-center">กำลังอัปโหลด... {progress}%</p>
          </div>
        )}
        
        <button 
          type="submit" 
          disabled={uploading}
          className="w-full py-2 px-4 bg-primary text-on-primary font-semibold rounded hover:opacity-90 disabled:opacity-50 transition"
        >
          {uploading ? 'กำลังประมวลผล...' : 'อัปโหลด'}
        </button>
      </form>
    </div>
  );
};
