use rusqlite;
use serde;

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct ThongTinTruong {
    pub don_vi_chu_quan: String,
    pub ten_truong: String,
    pub nam_hoc: String,
    pub ghi_chu: String,
    pub hieu_truong: String,
    pub pho_hieu_truong_1: String,
    pub pho_hieu_truong_2: String,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct GiaoVien {
    pub ma_gv: String,
    pub ho_ten: String,
    pub gioi_tinh: String,
    pub ngay_sinh: String,
    pub ma_so: String,
    pub so_dien_thoai: String,
    pub hop_dong: String,
    pub ghi_chu: String,
}

fn open_db(db_path: &str) -> Result<rusqlite::Connection, String> {
    rusqlite::Connection::open(db_path).map_err(|e| format!("{}", e))
}

pub fn ensure_ttt(conn: &rusqlite::Connection) -> Result<(), rusqlite::Error> {
    conn.execute_batch("CREATE TABLE IF NOT EXISTS thongtintruong (id INTEGER PRIMARY KEY AUTOINCREMENT, don_vi_chu_quan TEXT DEFAULT '', ten_truong TEXT DEFAULT '', nam_hoc TEXT NOT NULL, ghi_chu TEXT DEFAULT '', hieu_truong TEXT DEFAULT '', pho_hieu_truong_1 TEXT DEFAULT '', pho_hieu_truong_2 TEXT DEFAULT '', UNIQUE(nam_hoc));")?;
    for m in &["ALTER TABLE thongtintruong ADD COLUMN don_vi_chu_quan TEXT DEFAULT ''","ALTER TABLE thongtintruong ADD COLUMN ghi_chu TEXT DEFAULT ''","ALTER TABLE thongtintruong ADD COLUMN hieu_truong TEXT DEFAULT ''","ALTER TABLE thongtintruong ADD COLUMN pho_hieu_truong_1 TEXT DEFAULT ''","ALTER TABLE thongtintruong ADD COLUMN pho_hieu_truong_2 TEXT DEFAULT ''","CREATE UNIQUE INDEX IF NOT EXISTS idx_ttt_nh ON thongtintruong(nam_hoc)"] { let _ = conn.execute(m, []); }
    Ok(())
}

pub fn ensure_gv(conn: &rusqlite::Connection) -> Result<(), rusqlite::Error> {
    conn.execute_batch("CREATE TABLE IF NOT EXISTS thongtingiaovien (ma_gv TEXT PRIMARY KEY, ho_ten TEXT DEFAULT '', gioi_tinh TEXT DEFAULT '', ngay_sinh TEXT DEFAULT '', ma_so TEXT DEFAULT '', so_dien_thoai TEXT DEFAULT '', Hopdong TEXT DEFAULT '', ghi_chu TEXT DEFAULT '');")?;
    let _ = conn.execute("ALTER TABLE thongtingiaovien ADD COLUMN Hopdong TEXT DEFAULT ''", []);
    let _ = conn.execute("ALTER TABLE thongtingiaovien ADD COLUMN ghi_chu TEXT DEFAULT ''", []);
    Ok(())
}

#[tauri::command]
pub fn get_nam_hoc_list_truong(db_path: String) -> Result<Vec<String>, String> {
    let conn = open_db(&db_path)?;
    ensure_ttt(&conn).map_err(|e| format!("{}", e))?;
    let mut stmt = conn.prepare("SELECT DISTINCT nam_hoc FROM thongtintruong ORDER BY nam_hoc DESC").map_err(|e| format!("{}", e))?;
    let rows = stmt.query_map([], |r| r.get(0)).map_err(|e| format!("{}", e))?;
    let mut list = Vec::new();
    for r in rows { list.push(r.map_err(|e| format!("{}", e))?); }
    Ok(list)
}

#[tauri::command]
pub fn get_thong_tin_truong(db_path: String, nam_hoc: String) -> Result<Option<ThongTinTruong>, String> {
    let conn = open_db(&db_path)?;
    ensure_ttt(&conn).map_err(|e| format!("{}", e))?;
    let mut stmt = conn.prepare("SELECT don_vi_chu_quan, ten_truong, nam_hoc, ghi_chu, hieu_truong, pho_hieu_truong_1, pho_hieu_truong_2 FROM thongtintruong WHERE nam_hoc=?").map_err(|e| format!("{}", e))?;
    let mut rows = stmt.query_map([&nam_hoc], |r| Ok(ThongTinTruong {
        don_vi_chu_quan: r.get(0)?, ten_truong: r.get(1)?, nam_hoc: r.get(2)?, ghi_chu: r.get(3)?,
        hieu_truong: r.get(4)?, pho_hieu_truong_1: r.get(5)?, pho_hieu_truong_2: r.get(6)?,
    })).map_err(|e| format!("{}", e))?;
    Ok(rows.next().transpose().map_err(|e| format!("{}", e))?)
}

#[tauri::command]
pub fn save_thong_tin_truong(db_path: String, data: ThongTinTruong) -> Result<(), String> {
    let conn = open_db(&db_path)?;
    ensure_ttt(&conn).map_err(|e| format!("{}", e))?;
    conn.execute("INSERT INTO thongtintruong (don_vi_chu_quan,ten_truong,nam_hoc,ghi_chu,hieu_truong,pho_hieu_truong_1,pho_hieu_truong_2) VALUES(?1,?2,?3,?4,?5,?6,?7) ON CONFLICT(nam_hoc) DO UPDATE SET don_vi_chu_quan=?1,ten_truong=?2,ghi_chu=?4,hieu_truong=?5,pho_hieu_truong_1=?6,pho_hieu_truong_2=?7",
        rusqlite::params![data.don_vi_chu_quan,data.ten_truong,data.nam_hoc,data.ghi_chu,data.hieu_truong,data.pho_hieu_truong_1,data.pho_hieu_truong_2],
    ).map_err(|e| format!("{}", e))?;
    Ok(())
}

#[tauri::command]
pub fn add_nam_hoc_truong(db_path: String, nam_hoc: String) -> Result<(), String> {
    let conn = open_db(&db_path)?;
    ensure_ttt(&conn).map_err(|e| format!("{}", e))?;
    if conn.query_row("SELECT COUNT(*) FROM thongtintruong WHERE nam_hoc=?", [&nam_hoc], |r| r.get::<_,i64>(0)).map_err(|e| format!("{}", e))? > 0 {
        return Err(format!("Năm học '{}' đã tồn tại!", nam_hoc));
    }
    conn.execute("INSERT INTO thongtintruong (nam_hoc,don_vi_chu_quan,ten_truong,ghi_chu,hieu_truong,pho_hieu_truong_1,pho_hieu_truong_2) VALUES(?1,'','','','','','')", [&nam_hoc]).map_err(|e| format!("{}", e))?;
    Ok(())
}

#[tauri::command]
pub fn delete_nam_hoc_truong(db_path: String, nam_hoc: String) -> Result<(), String> {
    let conn = open_db(&db_path)?;
    ensure_ttt(&conn).map_err(|e| format!("{}", e))?;
    conn.execute("DELETE FROM thongtintruong WHERE nam_hoc=?", [&nam_hoc]).map_err(|e| format!("{}", e))?;
    Ok(())
}

#[tauri::command]
pub fn get_giao_vien_list(db_path: String) -> Result<Vec<GiaoVien>, String> {
    let conn = open_db(&db_path)?;
    ensure_gv(&conn).map_err(|e| format!("{}", e))?;
    let mut stmt = conn.prepare("SELECT ma_gv,ho_ten,gioi_tinh,ngay_sinh,ma_so,so_dien_thoai,Hopdong,ghi_chu FROM thongtingiaovien").map_err(|e| format!("{}", e))?;
    let rows = stmt.query_map([], |r| Ok(GiaoVien {
        ma_gv: r.get(0)?, ho_ten: r.get(1)?, gioi_tinh: r.get(2)?, ngay_sinh: r.get(3)?,
        ma_so: r.get(4)?, so_dien_thoai: r.get(5)?, hop_dong: r.get(6)?, ghi_chu: r.get(7)?,
    })).map_err(|e| format!("{}", e))?;
    let mut list = Vec::new();
    for r in rows { list.push(r.map_err(|e| format!("{}", e))?); }
    Ok(list)
}

#[tauri::command]
pub fn save_giao_vien_list(db_path: String, data: Vec<GiaoVien>) -> Result<(), String> {
    let conn = open_db(&db_path)?;
    ensure_gv(&conn).map_err(|e| format!("{}", e))?;
    conn.execute("DELETE FROM thongtingiaovien", []).map_err(|e| format!("{}", e))?;
    for gv in &data {
        conn.execute("INSERT INTO thongtingiaovien (ma_gv,ho_ten,gioi_tinh,ngay_sinh,ma_so,so_dien_thoai,Hopdong,ghi_chu) VALUES(?1,?2,?3,?4,?5,?6,?7,?8)",
            rusqlite::params![gv.ma_gv,gv.ho_ten,gv.gioi_tinh,gv.ngay_sinh,gv.ma_so,gv.so_dien_thoai,gv.hop_dong,gv.ghi_chu],
        ).map_err(|e| format!("{}", e))?;
    }
    Ok(())
}

#[tauri::command]
pub fn delete_all_giao_vien(db_path: String) -> Result<(), String> {
    let conn = open_db(&db_path)?;
    ensure_gv(&conn).map_err(|e| format!("{}", e))?;
    conn.execute("DELETE FROM thongtingiaovien", []).map_err(|e| format!("{}", e))?;
    Ok(())
}

#[tauri::command]
pub fn get_excel_sheets(file_path: String) -> Result<Vec<String>, String> {
    use calamine::{open_workbook_auto, Reader};
    let wb = open_workbook_auto(&file_path).map_err(|e| format!("{}", e))?;
    Ok(wb.sheet_names().to_vec())
}

#[tauri::command]
pub fn get_excel_columns(file_path: String, sheet_name: String) -> Result<Vec<String>, String> {
    use calamine::{open_workbook_auto, Reader};
    let mut wb = open_workbook_auto(&file_path).map_err(|e| format!("{}", e))?;
    let range = wb.worksheet_range(&sheet_name).map_err(|e| format!("{}", e))?;
    match range.rows().next() {
        Some(h) => Ok(h.iter().map(|c| c.to_string()).collect()),
        None => Err("Sheet trống".into()),
    }
}

#[tauri::command]
pub fn import_excel_rows(file_path: String, sheet_name: String, mapping: std::collections::HashMap<String, String>) -> Result<Vec<GiaoVien>, String> {
    use calamine::{open_workbook_auto, Reader};
    let mut wb = open_workbook_auto(&file_path).map_err(|e| format!("{}", e))?;
    let range = wb.worksheet_range(&sheet_name).map_err(|e| format!("{}", e))?;
    let mut rows = range.rows();
    let header: Vec<String> = match rows.next() {
        Some(h) => h.iter().map(|c| c.to_string()).collect(),
        None => return Ok(vec![]),
    };
    let mut cm: Vec<(usize, &str)> = Vec::new();
    for (f, ec) in &mapping {
        if let Some(i) = header.iter().position(|h| h == ec) { cm.push((i, f.as_str())); }
    }
    let mut result = Vec::new();
    for row in rows {
        let mut gv = GiaoVien { ma_gv: String::new(), ho_ten: String::new(), gioi_tinh: String::new(), ngay_sinh: String::new(), ma_so: String::new(), so_dien_thoai: String::new(), hop_dong: String::new(), ghi_chu: String::new() };
        for &(idx, field) in &cm {
            let val = row.get(idx).map(|c| c.to_string()).unwrap_or_default();
            match field {
                "ma_gv" => gv.ma_gv = val, "ho_ten" => gv.ho_ten = val, "gioi_tinh" => gv.gioi_tinh = val,
                "ngay_sinh" => gv.ngay_sinh = val, "ma_so" => gv.ma_so = val, "so_dien_thoai" => gv.so_dien_thoai = val,
                "hop_dong" => gv.hop_dong = val, "ghi_chu" => gv.ghi_chu = val, _ => {}
            }
        }
        if !gv.ma_gv.is_empty() { result.push(gv); }
    }
    Ok(result)
}
