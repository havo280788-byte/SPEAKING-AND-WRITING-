import React, { useState } from 'react';
import { Card } from './Components';

// Full list of students provided (Unaccented / English alphabet)
const STUDENTS = [
  "Hoa Quang An", "Pham Quynh Anh", "Ha Thi Minh Anh", "Cao Nguyen Quynh Anh", "Tran Nguyet Anh",
  "Hoa Gia Binh", "Hoang Van Cong Chinh", "Nguyen Manh Cuong", "Tran Thi Dung", "Nguyen Thanh Dat",
  "Nguyen Phuc Dien", "Nguyen Trung Duc", "Nguyen Le Gia Han", "Nguyen Phuong Hien", "Nguyen Hoang Gia Huynh",
  "Duong Gia Hung", "Dinh Van Hung", "Le Dinh Khoi", "Nguyen Thi Ngoc Lan", "Huynh Dang Khanh Linh",
  "Pham Vu Thuy Linh", "Nguyen Bui Yen Linh", "Dang Hoang Long", "Nguyen Khanh Ly", "Tran Hoang Minh",
  "Tran Nu Nguyet Nga", "Tran Nhu Ngoc", "Le Thi Nhu Ngoc", "Tran Nu Bao Ngoc", "Tran Hoang Nguyen",
  "Nguyen Thao Nguyen", "Phan Duy Nguyen", "Nguyen Thi Thanh Nhan", "Bui Thien Nhan", "Nguyen Ngoc Uyen Nhi",
  "Vu Nguyen Tue Nhi", "Nguyen Hoang Tam Nhu", "Le Kim Phat", "Nguyen Ba Phi", "Dinh Xuan Hoang Phuc",
  "Ta Pham Minh Phuc", "Tran Huu Quang", "Nguyen Tien Sang", "Tran Minh Thong", "Vu Le Phuong Thuy",
  "Vo Bao Thuy", "Nguyen Anh Thu", "Le Trinh Anh Thu", "Pham Anh Thu", "Nguyen Thuy Tien",
  "Nguyen Phuong Uyen", "Vu Thi Ha Vy"
];

interface Props {
  onLogin: (name: string) => void;
}

const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = STUDENTS.filter(student => 
    student.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-white flex flex-col items-center justify-center p-6 font-sans relative">
      <div className="w-full max-w-lg space-y-8 animate-fade-in-up z-10 my-auto">
        {/* Logo / Header */}
        <div className="text-center relative">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-blue-400/20 blur-3xl rounded-full"></div>
            <div className="relative w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-blue-500/30 mb-6 transform rotate-3 hover:rotate-0 transition-all duration-300">
                <i className="fas fa-shapes text-5xl"></i>
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">Welcome Class!</h1>
            <p className="text-lg text-gray-500">Find your name to start learning</p>
        </div>

        <Card className="!p-0 !rounded-3xl border border-white/60 shadow-xl backdrop-blur-xl bg-white/80">
            {/* Search Bar */}
            <div className="p-6 border-b border-gray-100 bg-white/50 sticky top-0 z-10">
                <div className="relative group">
                    <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-lg group-focus-within:text-blue-500 transition-colors"></i>
                    <input 
                        type="text" 
                        placeholder="Search your name..." 
                        className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all text-lg font-medium placeholder-gray-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="max-h-[55vh] overflow-y-auto custom-scrollbar bg-transparent">
                {filteredStudents.length > 0 ? (
                    <div className="p-3 space-y-2">
                        {filteredStudents.map((student, idx) => (
                            <button
                                key={idx}
                                onClick={() => onLogin(student)}
                                className="w-full text-left px-5 py-4 hover:bg-white hover:shadow-md rounded-2xl transition-all duration-200 flex items-center gap-4 group border border-transparent hover:border-gray-50"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 text-gray-500 flex items-center justify-center font-bold text-xl group-hover:from-blue-100 group-hover:to-indigo-100 group-hover:text-blue-700 transition-all shadow-inner">
                                    {student.charAt(0)}
                                </div>
                                <span className="font-semibold text-lg text-gray-700 group-hover:text-blue-700">{student}</span>
                                <div className="ml-auto w-10 h-10 rounded-full flex items-center justify-center bg-transparent group-hover:bg-blue-50 transition-colors">
                                    <i className="fas fa-chevron-right text-gray-300 group-hover:text-blue-500"></i>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center text-gray-400">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-user-slash text-3xl text-gray-300"></i>
                        </div>
                        <p className="text-lg font-medium">No student found.</p>
                    </div>
                )}
            </div>
            
            <div className="p-4 bg-gray-50/80 text-center text-sm font-medium text-gray-400 border-t border-gray-100 uppercase tracking-wider">
                LinguaAI Class Management System
            </div>
        </Card>
      </div>

      <footer className="mt-8 py-4 text-center text-orange-600 text-xs font-bold uppercase tracking-widest">
        DEVELOPED BY TEACHER VO THI THU HA - TRAN HUNG DAO HIGH SCHOOL - LAM DONG
      </footer>
    </div>
  );
};

export default LoginScreen;