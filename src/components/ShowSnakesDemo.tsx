import React, { useEffect, useState } from 'react';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

interface SnakeData {
  id: string;
  name: string;
  species: string;
  imageUrl: string;
  createdAt: any;
}

export const ShowSnakesDemo: React.FC = () => {
  const [snakes, setSnakes] = useState<SnakeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. กำหนด Query ไปที่ collection 'snakes' และเรียงลำดับตามวันที่สร้างล่าสุด (จากใหม่ไปเก่า)
    const q = query(collection(db, 'snakes'), orderBy('createdAt', 'desc'));

    // 2. ดึงข้อมูลแบบ Real-time (ถ้ามีการอัปโหลดข้อมูลใหม่ หน้าเว็บจะอัปเดตอัตโนมัติโดยไม่ต้องกด Refresh)
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const snakeList: SnakeData[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          snakeList.push({
            id: doc.id,
            name: data.name || 'ไม่มีชื่อ',
            species: data.species || 'ไม่ระบุสายพันธุ์',
            imageUrl: data.imageUrl || '',
            createdAt: data.createdAt,
          });
        });
        setSnakes(snakeList);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching snakes:', error);
        setLoading(false);
      }
    );

    // 3. ยกเลิกการฟังข้อมูลเมื่อ Component ถูกปิดใช้งาน (Cleanup)
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="text-center py-8">กำลังดาวน์โหลดข้อมูลจาก Firestore...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h3 className="text-2xl font-bold text-primary mb-6 text-center">รายการงูทั้งหมดที่ดึงมาจาก Firebase</h3>
      
      {snakes.length === 0 ? (
        <p className="text-center text-on-surface-variant">ยังไม่มีข้อมูลในระบบ ลองอัปโหลดภาพก่อน!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {snakes.map((snake) => (
            <div 
              key={snake.id} 
              className="bg-surface-variant rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow duration-300"
            >
              {/* ส่วนรูปภาพที่ดึงมาจาก Firebase Storage URL */}
              <div className="w-full h-48 bg-outline-variant flex items-center justify-center overflow-hidden">
                {snake.imageUrl ? (
                  <img 
                    src={snake.imageUrl} 
                    alt={snake.name} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-on-surface-variant">ไม่มีรูปภาพ</span>
                )}
              </div>

              {/* ส่วนข้อมูลที่ดึงมาจาก Firestore */}
              <div className="p-4">
                <h4 className="text-lg font-bold text-on-surface mb-1">{snake.name}</h4>
                <p className="text-sm text-on-surface-variant mb-2">สายพันธุ์: {snake.species}</p>
                <div className="text-xs text-outline text-right">
                  {snake.createdAt ? new Date(snake.createdAt.seconds * 1000).toLocaleString('th-TH') : 'กำลังบันทึก...'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
