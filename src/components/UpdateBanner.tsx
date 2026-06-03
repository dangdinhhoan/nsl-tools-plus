import React, { useState } from "react";
import { AlertTriangle, Download, X, Sparkles } from "lucide-react";
import "./UpdateBanner.css";

interface UpdateBannerProps {
  version: string;
  currentVersion: string;
  downloadUrl: string;
  dbPath: string | null;
  onDismiss: () => void;
  onUpdate: () => void;
}

const UpdateBanner: React.FC<UpdateBannerProps> = ({
  version,
  currentVersion,
  downloadUrl,
  dbPath,
  onDismiss,
  onUpdate,
}) => {
  const [confirming, setConfirming] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleUpdateClick = () => {
    if (dbPath) {
      setConfirming(true);
    } else {
      startUpdate();
    }
  };

  const startUpdate = () => {
    setDownloading(true);
    onUpdate();
  };

  return (
    <div className="update-banner">
      <div className="update-banner-glow" />
      <div className="update-banner-content">
        <div className="update-banner-left">
          <div className="update-icon-wrapper">
            <Sparkles size={22} className="update-icon" />
          </div>
          <div className="update-text">
            <span className="update-title">Đã có phiên bản mới!</span>
            <span className="update-detail">
              Phiên bản <strong>v{version}</strong> đã sẵn sàng.
              Bạn đang dùng <strong>v{currentVersion}</strong>.
            </span>
          </div>
        </div>
        <div className="update-banner-right">
          {confirming ? (
            <div className="update-confirm">
              <AlertTriangle size={16} className="confirm-icon" />
              <span className="confirm-text">
                Bạn có dữ liệu đang mở. Hãy lưu dữ liệu trước khi cập nhật!
              </span>
              <button className="update-btn update-btn-go" onClick={startUpdate} disabled={downloading}>
                {downloading ? "Đang tải..." : "Vẫn cập nhật"}
              </button>
              <button className="update-btn update-btn-cancel" onClick={() => setConfirming(false)}>
                Để tôi lưu đã
              </button>
            </div>
          ) : (
            <button className="update-btn update-btn-main" onClick={handleUpdateClick} disabled={downloading}>
              <Download size={16} />
              <span>{downloading ? "Đang tải..." : "Cập nhật ngay"}</span>
            </button>
          )}
          <button className="update-dismiss" onClick={onDismiss} title="Bỏ qua">
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateBanner;
