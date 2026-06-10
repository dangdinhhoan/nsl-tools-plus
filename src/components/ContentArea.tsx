import React from "react";
import {
  Sparkles,
  ArrowLeft,
  Layout,
  Database,
  Zap,
  Shield,
} from "lucide-react";
import ThongTinTruong from "./ThongTinTruong";
import GiaoVien from "./GiaoVien";
import "./ContentArea.css";

interface ContentAreaProps {
  activeItem: string | null;
  dbPath: string | null;
}

const ContentArea: React.FC<ContentAreaProps> = ({ activeItem, dbPath }) => {
  if (!activeItem) {
    return (
      <main className="content-area">
        <div className="welcome-container">
          {/* Welcome card */}
          <div className="welcome-card glass">
            <div className="welcome-icon">
              <Sparkles size={48} strokeWidth={1.5} />
            </div>
            <h1 className="welcome-title">NSL Tools Plus</h1>
            <p className="welcome-subtitle">
              Hệ thống quản lý nhà trường toàn diện
            </p>
            <p className="welcome-desc">
              {dbPath
                ? `Đang mở: ${dbPath}`
                : "Vui lòng chọn một chức năng từ menu bên trái để bắt đầu làm việc."}
            </p>

            {/* Feature cards */}
            <div className="feature-grid">
              <div className="feature-card">
                <div className="feature-icon feature-icon-blue">
                  <Layout size={20} />
                </div>
                <span>Giao diện hiện đại</span>
              </div>
              <div className="feature-card">
                <div className="feature-icon feature-icon-purple">
                  <Database size={20} />
                </div>
                <span>Quản lý dữ liệu</span>
              </div>
              <div className="feature-card">
                <div className="feature-icon feature-icon-green">
                  <Zap size={20} />
                </div>
                <span>Tính toán nhanh</span>
              </div>
              <div className="feature-card">
                <div className="feature-icon feature-icon-amber">
                  <Shield size={20} />
                </div>
                <span>Bảo mật cao</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="content-area">
      {activeItem === "Trường" ? (
        <div className="page-container glass">
          <ThongTinTruong dbPath={dbPath} />
        </div>
      ) : activeItem === "Giáo viên" ? (
        <div className="page-container glass">
          <GiaoVien dbPath={dbPath} />
        </div>
      ) : (
      <div className="page-container glass">
        {/* Page header */}
        <div className="page-header">
          <div className="page-header-left">
            <div className="page-back-icon">
              <ArrowLeft size={16} />
            </div>
            <h2 className="page-title">{activeItem}</h2>
          </div>
          <div className="page-badge">Đang phát triển</div>
        </div>

        {/* Page content placeholder */}
        <div className="page-content">
          <div className="placeholder-card">
            <div className="placeholder-icon">
              <Sparkles size={36} strokeWidth={1.5} />
            </div>
            <h3>Chức năng đang được phát triển</h3>
            <p>
              Chức năng <strong>"{activeItem}"</strong> sẽ sớm được hoàn thiện
              trong phiên bản tiếp theo.
            </p>
          </div>
        </div>
      </div>
      )}
    </main>
  );
};

export default ContentArea;
