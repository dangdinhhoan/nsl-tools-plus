import React, { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Save, Plus, Trash2, School } from "lucide-react";
import "./ThongTinTruong.css";

interface ThongTinTruongData {
  don_vi_chu_quan: string;
  ten_truong: string;
  nam_hoc: string;
  ghi_chu: string;
  hieu_truong: string;
  pho_hieu_truong_1: string;
  pho_hieu_truong_2: string;
}

interface Props {
  dbPath: string | null;
}

const ThongTinTruong: React.FC<Props> = ({ dbPath }) => {
  const [namHocList, setNamHocList] = useState<string[]>([]);
  const [selectedNamHoc, setSelectedNamHoc] = useState("");
  const [data, setData] = useState<ThongTinTruongData>({
    don_vi_chu_quan: "",
    ten_truong: "",
    nam_hoc: "",
    ghi_chu: "",
    hieu_truong: "",
    pho_hieu_truong_1: "",
    pho_hieu_truong_2: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadNamHocList = useCallback(async () => {
    if (!dbPath) return;
    try {
      const list = await invoke<string[]>("get_nam_hoc_list_truong", { dbPath });
      setNamHocList(list);
      if (list.length > 0 && !selectedNamHoc) {
        setSelectedNamHoc(list[0]);
      }
    } catch (e) {
      console.error("Lỗi tải danh sách năm học:", e);
    }
  }, [dbPath]);

  const loadData = useCallback(async (namHoc: string) => {
    if (!dbPath || !namHoc) {
      setData({ don_vi_chu_quan: "", ten_truong: "", nam_hoc: "", ghi_chu: "", hieu_truong: "", pho_hieu_truong_1: "", pho_hieu_truong_2: "" });
      return;
    }
    try {
      const record = await invoke<ThongTinTruongData | null>("get_thong_tin_truong", { dbPath, namHoc });
      if (record) {
        setData(record);
      } else {
        setData({ don_vi_chu_quan: "", ten_truong: "", nam_hoc: namHoc, ghi_chu: "", hieu_truong: "", pho_hieu_truong_1: "", pho_hieu_truong_2: "" });
      }
    } catch (e) {
      console.error("Lỗi tải dữ liệu:", e);
    }
  }, [dbPath]);

  useEffect(() => { loadNamHocList(); }, [loadNamHocList]);
  useEffect(() => { loadData(selectedNamHoc); }, [selectedNamHoc, loadData]);

  const handleSave = async () => {
    if (!dbPath) return;
    setSaving(true);
    setMessage(null);
    try {
      await invoke("save_thong_tin_truong", {
        dbPath,
        data: { ...data, nam_hoc: selectedNamHoc },
      });
      setMessage({ type: "success", text: "Đã lưu thông tin trường thành công!" });
    } catch (e) {
      setMessage({ type: "error", text: `Lỗi: ${e}` });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleAddNamHoc = async () => {
    if (!dbPath) return;
    const namHoc = prompt("Nhập năm học mới (VD: 2025-2026):");
    if (!namHoc?.trim()) return;
    try {
      await invoke("add_nam_hoc_truong", { dbPath, namHoc: namHoc.trim() });
      await loadNamHocList();
      setSelectedNamHoc(namHoc.trim());
    } catch (e) {
      alert(`Lỗi: ${e}`);
    }
  };

  const handleDeleteNamHoc = async () => {
    if (!dbPath || !selectedNamHoc) return;
    if (!confirm(`Bạn có chắc muốn xóa năm học "${selectedNamHoc}"?`)) return;
    try {
      await invoke("delete_nam_hoc_truong", { dbPath, namHoc: selectedNamHoc });
      await loadNamHocList();
      setSelectedNamHoc("");
    } catch (e) {
      alert(`Lỗi: ${e}`);
    }
  };

  if (!dbPath) {
    return (
      <div className="ttt-empty">
        <School size={48} strokeWidth={1.5} />
        <p>Vui lòng tạo hoặc mở CSDL trước</p>
      </div>
    );
  }

  return (
    <div className="ttt-container">
      {/* Header */}
      <div className="ttt-header">
        <div className="ttt-header-left">
          <School size={22} />
          <h2>Thông tin trường</h2>
        </div>
      </div>

      {/* Năm học selector */}
      <div className="ttt-toolbar">
        <div className="ttt-namhoc-group">
          <label>Năm học:</label>
          <select
            value={selectedNamHoc}
            onChange={(e) => setSelectedNamHoc(e.target.value)}
          >
            <option value="">-- Chọn năm học --</option>
            {namHocList.map((nh) => (
              <option key={nh} value={nh}>{nh}</option>
            ))}
          </select>
          <button className="ttt-btn ttt-btn-add" onClick={handleAddNamHoc} title="Thêm năm học mới">
            <Plus size={16} />
            <span>Thêm</span>
          </button>
          <button className="ttt-btn ttt-btn-del" onClick={handleDeleteNamHoc} disabled={!selectedNamHoc} title="Xóa năm học này">
            <Trash2 size={16} />
            <span>Xóa</span>
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="ttt-form">
        <div className="ttt-form-row">
          <label>Đơn vị chủ quản</label>
          <input
            type="text"
            value={data.don_vi_chu_quan}
            onChange={(e) => setData({ ...data, don_vi_chu_quan: e.target.value.toUpperCase() })}
            disabled={!selectedNamHoc}
            placeholder="Nhập đơn vị chủ quản"
            style={{ textTransform: "uppercase" }}
          />
        </div>
        <div className="ttt-form-row">
          <label>Tên trường <span className="ttt-required">*</span></label>
          <input
            type="text"
            value={data.ten_truong}
            onChange={(e) => setData({ ...data, ten_truong: e.target.value.toUpperCase() })}
            disabled={!selectedNamHoc}
            placeholder="Nhập tên trường"
            style={{ textTransform: "uppercase" }}
          />
        </div>
        <div className="ttt-form-row">
          <label>Hiệu trưởng</label>
          <input
            type="text"
            value={data.hieu_truong}
            onChange={(e) => setData({ ...data, hieu_truong: e.target.value })}
            disabled={!selectedNamHoc}
            placeholder="Nhập tên hiệu trưởng"
          />
        </div>
        <div className="ttt-form-row ttt-form-row-half">
          <div className="ttt-form-col">
            <label>Phó hiệu trưởng 1</label>
            <input
              type="text"
              value={data.pho_hieu_truong_1}
              onChange={(e) => setData({ ...data, pho_hieu_truong_1: e.target.value })}
              disabled={!selectedNamHoc}
              placeholder="Nhập tên"
            />
          </div>
          <div className="ttt-form-col">
            <label>Phó hiệu trưởng 2</label>
            <input
              type="text"
              value={data.pho_hieu_truong_2}
              onChange={(e) => setData({ ...data, pho_hieu_truong_2: e.target.value })}
              disabled={!selectedNamHoc}
              placeholder="Nhập tên"
            />
          </div>
        </div>
        <div className="ttt-form-row">
          <label>Ghi chú</label>
          <textarea
            value={data.ghi_chu}
            onChange={(e) => setData({ ...data, ghi_chu: e.target.value })}
            disabled={!selectedNamHoc}
            placeholder="Nhập ghi chú"
            rows={3}
          />
        </div>

        {/* Save button */}
        <div className="ttt-form-actions">
          <button className="ttt-btn ttt-btn-save" onClick={handleSave} disabled={!selectedNamHoc || saving}>
            <Save size={16} />
            <span>{saving ? "Đang lưu..." : "Lưu dữ liệu"}</span>
          </button>
          {message && (
            <span className={`ttt-msg ${message.type}`}>{message.text}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThongTinTruong;
