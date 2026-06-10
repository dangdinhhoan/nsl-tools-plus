import React, { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Save, Plus, Trash2, Users, Upload } from "lucide-react";
import "./GiaoVien.css";

interface GiaoVienData {
  ma_gv: string;
  ho_ten: string;
  gioi_tinh: string;
  ngay_sinh: string;
  ma_so: string;
  so_dien_thoai: string;
  hop_dong: string;
  ghi_chu: string;
}

interface Props {
  dbPath: string | null;
}

const emptyGv = (): GiaoVienData => ({
  ma_gv: "", ho_ten: "", gioi_tinh: "", ngay_sinh: "", ma_so: "", so_dien_thoai: "", hop_dong: "", ghi_chu: "",
});

// Vietnamese name sort: Tên -> Họ -> Họ lót
function vnNameSort(a: GiaoVienData, b: GiaoVienData): number {
  const partsA = a.ho_ten.trim().split(/\s+/);
  const partsB = b.ho_ten.trim().split(/\s+/);
  if (partsA.length === 0 && partsB.length === 0) return 0;
  if (partsA.length === 0) return -1;
  if (partsB.length === 0) return 1;

  const tenA = partsA[partsA.length - 1].toLowerCase();
  const tenB = partsB[partsB.length - 1].toLowerCase();
  if (tenA !== tenB) return tenA.localeCompare(tenB, "vi");

  const hoA = partsA[0].toLowerCase();
  const hoB = partsB[0].toLowerCase();
  if (hoA !== hoB) return hoA.localeCompare(hoB, "vi");

  const lotA = partsA.slice(1, -1).join(" ").toLowerCase();
  const lotB = partsB.slice(1, -1).join(" ").toLowerCase();
  return lotA.localeCompare(lotB, "vi");
}

function sortGiaoVien(data: GiaoVienData[]): GiaoVienData[] {
  return [...data].sort(vnNameSort);
}

const headers = ["STT", "Mã GV", "Họ và tên", "Giới tính", "Ngày sinh", "Mã Sở", "SĐT", "Hợp đồng", "Ghi chú"];

const GiaoVien: React.FC<Props> = ({ dbPath }) => {
  const [rows, setRows] = useState<GiaoVienData[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Excel import state
  const [showImport, setShowImport] = useState(false);
  const [excelPath, setExcelPath] = useState("");
  const [sheets, setSheets] = useState<string[]>([]);
  const [selSheet, setSelSheet] = useState("");
  const [excelCols, setExcelCols] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);

  const dbFields = ["ma_gv", "ho_ten", "gioi_tinh", "ngay_sinh", "ma_so", "so_dien_thoai", "hop_dong", "ghi_chu"];
  const fieldLabels: Record<string, string> = {
    ma_gv: "Mã GV", ho_ten: "Họ và tên", gioi_tinh: "Giới tính", ngay_sinh: "Ngày sinh",
    ma_so: "Mã Sở", so_dien_thoai: "SĐT", hop_dong: "Hợp đồng", ghi_chu: "Ghi chú",
  };

  const loadData = useCallback(async () => {
    if (!dbPath) { setRows([]); return; }
    try {
      const data = await invoke<GiaoVienData[]>("get_giao_vien_list", { dbPath });
      setRows(sortGiaoVien(data));
    } catch (e) {
      console.error("Lỗi tải:", e);
    }
  }, [dbPath]);

  useEffect(() => { loadData(); }, [loadData]);

  const addRow = () => {
    setRows([...rows, emptyGv()]);
  };

  const deleteSelected = () => {
    if (selected.size === 0) return;
    if (!confirm(`Xóa ${selected.size} giáo viên đã chọn?`)) return;
    const selectedArr = Array.from(selected).sort((a, b) => b - a);
    const newRows = [...rows];
    for (const i of selectedArr) newRows.splice(i, 1);
    setRows(newRows);
    setSelected(new Set());
  };

  const deleteAll = () => {
    if (rows.length === 0) return;
    if (!confirm("Xóa TOÀN BỘ giáo viên?")) return;
    setRows([]);
    setSelected(new Set());
  };

  const updateCell = (rowIdx: number, field: keyof GiaoVienData, value: string) => {
    const newRows = [...rows];
    newRows[rowIdx] = { ...newRows[rowIdx], [field]: value };
    setRows(newRows);
  };

  const toggleSelect = (rowIdx: number) => {
    const next = new Set(selected);
    if (next.has(rowIdx)) next.delete(rowIdx); else next.add(rowIdx);
    setSelected(next);
  };

  const handlePickExcel = async () => {
    // Use the native file dialog via Rust
    try {
      const path = prompt("Nhập đường dẫn file Excel (.xlsx, .xls):");
      if (!path) return;
      setExcelPath(path);
      const sheetList = await invoke<string[]>("get_excel_sheets", { filePath: path });
      setSheets(sheetList);
      if (sheetList.length > 0) {
        setSelSheet(sheetList[0]);
        const cols = await invoke<string[]>("get_excel_columns", { filePath: path, sheetName: sheetList[0] });
        setExcelCols(cols);
        autoMap(cols);
      }
      setShowImport(true);
    } catch (e) {
      setMsg({ type: "error", text: `Lỗi: ${e}` });
    }
  };

  const autoMap = (cols: string[]) => {
    const map: Record<string, string> = {};
    for (const f of dbFields) {
      const label = fieldLabels[f].toLowerCase();
      // Try exact match first, then fuzzy
      let match = cols.find(c => c.toLowerCase() === label);
      if (!match) {
        match = cols.find(c => c.toLowerCase().includes(label) || label.includes(c.toLowerCase()));
      }
      if (match) map[f] = match;
    }
    setMapping(map);
  };

  const handleSheetChange = async (sheet: string) => {
    setSelSheet(sheet);
    try {
      const cols = await invoke<string[]>("get_excel_columns", { filePath: excelPath, sheetName: sheet });
      setExcelCols(cols);
      autoMap(cols);
    } catch (e) { /* ignore */ }
  };

  const handleImport = async () => {
    if (!excelPath || !selSheet) return;
    setImporting(true);
    try {
      const data = await invoke<GiaoVienData[]>("import_excel_rows", {
        filePath: excelPath, sheetName: selSheet, mapping,
      });
      // Merge: update existing, add new
      const existing = new Map(rows.map(r => [r.ma_gv, r]));
      for (const gv of data) {
        existing.set(gv.ma_gv, { ...(existing.get(gv.ma_gv) || {}), ...gv });
      }
      const merged = sortGiaoVien(Array.from(existing.values()));
      setRows(merged);
      setMsg({ type: "success", text: `Đã import ${data.length} giáo viên! Nhấn Lưu để ghi vào CSDL.` });
      setShowImport(false);
    } catch (e) {
      setMsg({ type: "error", text: `Lỗi import: ${e}` });
    } finally {
      setImporting(false);
      setTimeout(() => setMsg(null), 4000);
    }
  };

  const handleSave = async () => {
    if (!dbPath) return;
    setSaving(true);
    setMsg(null);
    try {
      const valid = rows.filter(r => r.ma_gv.trim());
      await invoke("save_giao_vien_list", { dbPath, data: valid });
      setMsg({ type: "success", text: `Đã lưu ${valid.length} giáo viên!` });
      await loadData();
    } catch (e) {
      setMsg({ type: "error", text: `Lỗi: ${e}` });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 3000);
    }
  };

  if (!dbPath) {
    return (
      <div className="gv-empty">
        <Users size={48} strokeWidth={1.5} />
        <p>Vui lòng tạo hoặc mở CSDL trước</p>
      </div>
    );
  }

  return (
    <div className="gv-container">
      <div className="gv-header">
        <div className="gv-header-left">
          <Users size={22} />
          <h2>Giáo viên</h2>
        </div>
        <span className="gv-count">{rows.length} giáo viên</span>
      </div>

      <div className="gv-toolbar">
        <button className="gv-btn gv-btn-outline" onClick={handlePickExcel} title="Import Excel">
          <Upload size={16} />
          <span>Import Excel</span>
        </button>
        <div className="gv-toolbar-spacer" />
        <button className="gv-btn gv-btn-add" onClick={addRow}>
          <Plus size={16} />
          <span>Thêm</span>
        </button>
        <button className="gv-btn gv-btn-del" onClick={deleteSelected} disabled={selected.size === 0}>
          <Trash2 size={16} />
          <span>Xóa đã chọn</span>
        </button>
        <button className="gv-btn gv-btn-del-all" onClick={deleteAll} disabled={rows.length === 0}>
          <Trash2 size={16} />
          <span>Xóa tất cả</span>
        </button>
        <button className="gv-btn gv-btn-save" onClick={handleSave} disabled={saving}>
          <Save size={16} />
          <span>{saving ? "Đang lưu..." : "Lưu vào CSDL"}</span>
        </button>
        {msg && <span className={`gv-msg ${msg.type}`}>{msg.text}</span>}
      </div>

      {showImport && (
        <div className="gv-import-overlay" onClick={() => setShowImport(false)}>
          <div className="gv-import-dialog" onClick={e => e.stopPropagation()}>
            <h3>Import từ Excel</h3>
            <div className="gv-import-row">
              <label>Sheet:</label>
              <select value={selSheet} onChange={e => handleSheetChange(e.target.value)}>
                {sheets.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="gv-import-mapping">
              <p>Ánh xạ cột Excel → Trường dữ liệu:</p>
              {dbFields.map(f => (
                <div key={f} className="gv-import-row">
                  <label>{fieldLabels[f]}:</label>
                  <select
                    value={mapping[f] || ""}
                    onChange={e => setMapping({ ...mapping, [f]: e.target.value })}
                  >
                    <option value="">-- Bỏ qua --</option>
                    {excelCols.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="gv-import-actions">
              <button className="gv-btn gv-btn-save" onClick={handleImport} disabled={importing || !mapping.ma_gv}>
                {importing ? "Đang import..." : "Import"}
              </button>
              <button className="gv-btn gv-btn-outline" onClick={() => setShowImport(false)}>Hủy</button>
            </div>
          </div>
        </div>
      )}
      <div className="gv-table-wrap">
        <table className="gv-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>STT</th>
              <th style={{ width: 38 }}></th>
              <th style={{ width: 100 }}>Mã GV</th>
              <th style={{ width: 180 }}>Họ và tên</th>
              <th style={{ width: 80 }}>Giới tính</th>
              <th style={{ width: 100 }}>Ngày sinh</th>
              <th style={{ width: 100 }}>Mã Sở</th>
              <th style={{ width: 110 }}>SĐT</th>
              <th style={{ width: 80 }}>Hợp đồng</th>
              <th style={{ minWidth: 200 }}>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={selected.has(i) ? "gv-row-selected" : ""}>
                <td className="gv-td-center">{i + 1}</td>
                <td className="gv-td-center">
                  <input type="checkbox" checked={selected.has(i)} onChange={() => toggleSelect(i)} />
                </td>
                <td><input value={row.ma_gv} onChange={e => updateCell(i, "ma_gv", e.target.value)} placeholder="Mã GV" /></td>
                <td><input value={row.ho_ten} onChange={e => updateCell(i, "ho_ten", e.target.value)} placeholder="Họ và tên" /></td>
                <td><input value={row.gioi_tinh} onChange={e => updateCell(i, "gioi_tinh", e.target.value)} placeholder="Nam/Nữ" /></td>
                <td><input value={row.ngay_sinh} onChange={e => updateCell(i, "ngay_sinh", e.target.value)} placeholder="dd/mm/yyyy" /></td>
                <td><input value={row.ma_so} onChange={e => updateCell(i, "ma_so", e.target.value)} placeholder="Mã Sở" /></td>
                <td><input value={row.so_dien_thoai} onChange={e => updateCell(i, "so_dien_thoai", e.target.value)} placeholder="SĐT" /></td>
                <td>
                  <select value={row.hop_dong} onChange={e => updateCell(i, "hop_dong", e.target.value)}>
                    <option value="">--</option>
                    <option value="X">X</option>
                  </select>
                </td>
                <td><input value={row.ghi_chu} onChange={e => updateCell(i, "ghi_chu", e.target.value)} placeholder="Ghi chú" /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="gv-table-empty">Chưa có giáo viên nào. Nhấn "Thêm" để bắt đầu.</div>
        )}
      </div>
    </div>
  );
};

export default GiaoVien;
