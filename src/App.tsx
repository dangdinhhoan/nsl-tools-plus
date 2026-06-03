import { useState, useCallback, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import ContentArea from "./components/ContentArea";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import "./App.css";

export interface MenuItem {
  label: string;
  icon: string;
}

export interface MenuGroup {
  header: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    header: "Thông tin",
    items: [
      { label: "Trường", icon: "school" },
      { label: "Giáo viên", icon: "users" },
      { label: "Môn dạy", icon: "book" },
      { label: "Lớp dạy", icon: "door-open" },
      { label: "Thời khóa biểu", icon: "calendar" },
      { label: "Khai báo thời gian năm học", icon: "clock" },
      { label: "Ngày nghỉ", icon: "calendar-off" },
      { label: "Lịch học đặc biệt", icon: "calendar-star" },
      { label: "Chức vụ kiêm nhiệm", icon: "briefcase" },
      { label: "Giáo viên kiêm nhiệm", icon: "user-check" },
      { label: "Số tiết nghĩa vụ", icon: "hash" },
      { label: "Các tiết dạy khác", icon: "ellipsis" },
    ],
  },
  {
    header: "Phụ trội",
    items: [
      { label: "Mẫu phụ trội tổng hợp", icon: "table" },
      { label: "Mẫu phụ trội cá nhân", icon: "user" },
      { label: "Môn không tính phụ trội", icon: "ban" },
      { label: "Môn tính tiết chủ nhiệm", icon: "star" },
      { label: "Khai báo môn chính", icon: "book-open" },
    ],
  },
  {
    header: "Chấm công",
    items: [
      { label: "Chấm công", icon: "clipboard-check" },
      { label: "Khai báo thông tin", icon: "info" },
    ],
  },
  {
    header: "Hòa nhập",
    items: [
      { label: "Tính tiết dạy hòa nhập", icon: "calculator" },
      { label: "DSHS Hòa nhập", icon: "list" },
      { label: "Môn không tính hòa nhập", icon: "ban" },
    ],
  },
];

function App() {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [dbPath, setDbPath] = useState<string | null>(null);

  // Sync window title whenever dbPath changes
  useEffect(() => {
    const appWindow = getCurrentWindow();
    if (dbPath) {
      const fileName = dbPath.split(/[\\/]/).pop() || dbPath;
      const title = `NSL Tools Plus - ${fileName}  [${dbPath}]`;
      appWindow.setTitle(title);
      document.title = title;
    } else {
      appWindow.setTitle("NSL Tools Plus");
      document.title = "NSL Tools Plus";
    }
  }, [dbPath]);

  const handleNewDb = useCallback(async () => {
    try {
      const path: string = await invoke("new_database");
      setDbPath(path);
    } catch (e) {
      if (typeof e === "string" && e.includes("hủy")) return;
      console.error("Lỗi tạo mới CSDL:", e);
    }
  }, []);

  const handleOpenDb = useCallback(async () => {
    try {
      const path: string = await invoke("open_database");
      setDbPath(path);
    } catch (e) {
      if (typeof e === "string" && e.includes("hủy")) return;
      console.error("Lỗi mở CSDL:", e);
    }
  }, []);

  const handleSaveAsDb = useCallback(async () => {
    if (!dbPath) return;
    try {
      const newPath: string = await invoke("save_as_database", { currentPath: dbPath });
      setDbPath(newPath);
    } catch (e) {
      if (typeof e === "string" && e.includes("hủy")) return;
      console.error("Lỗi lưu CSDL:", e);
    }
  }, [dbPath]);

  return (
    <div className="app-container">
      <Sidebar
        menuGroups={menuGroups}
        activeItem={activeItem}
        onSelectItem={setActiveItem}
        dbPath={dbPath}
        onNewDb={handleNewDb}
        onOpenDb={handleOpenDb}
        onSaveAsDb={handleSaveAsDb}
      />
      <ContentArea activeItem={activeItem} dbPath={dbPath} />
    </div>
  );
}

export default App;
