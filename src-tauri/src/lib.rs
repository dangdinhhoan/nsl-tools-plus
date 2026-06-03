use tauri::Manager;
use tauri_plugin_dialog::DialogExt;
use std::fs;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Xin chào, {}! Chào mừng đến với NSL Tools Plus.", name)
}

#[tauri::command]
async fn new_database(app: tauri::AppHandle) -> Result<String, String> {
    let file_path = app
        .dialog()
        .file()
        .add_filter("SQLite Database", &["db", "sqlite", "sqlite3"])
        .blocking_save_file();

    match file_path {
        Some(path) => {
            let path_str = path.to_string();
            // Create empty SQLite database
            if let Err(e) = create_empty_db(&path_str) {
                return Err(format!("Không thể tạo CSDL: {}", e));
            }
            Ok(path_str)
        }
        None => Err("Đã hủy tạo mới".into()),
    }
}

#[tauri::command]
async fn open_database(app: tauri::AppHandle) -> Result<String, String> {
    let file_path = app
        .dialog()
        .file()
        .add_filter("SQLite Database", &["db", "sqlite", "sqlite3"])
        .blocking_pick_file();

    match file_path {
        Some(path) => Ok(path.to_string()),
        None => Err("Đã hủy mở file".into()),
    }
}

#[tauri::command]
async fn save_as_database(app: tauri::AppHandle, current_path: String) -> Result<String, String> {
    let file_path = app
        .dialog()
        .file()
        .add_filter("SQLite Database", &["db", "sqlite", "sqlite3"])
        .blocking_save_file();

    match file_path {
        Some(new_path) => {
            let new_path_str = new_path.to_string();
            if let Err(e) = fs::copy(&current_path, &new_path_str) {
                return Err(format!("Không thể lưu file: {}", e));
            }
            Ok(new_path_str)
        }
        None => Err("Đã hủy lưu".into()),
    }
}

fn create_empty_db(path: &str) -> Result<(), Box<dyn std::error::Error>> {
    let conn = rusqlite::Connection::open(path)?;
    conn.execute_batch("
        CREATE TABLE IF NOT EXISTS thongtintruong (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nam_hoc TEXT,
            ten_truong TEXT,
            dia_chi TEXT,
            dien_thoai TEXT,
            hieu_truong TEXT
        );
    ")?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            new_database,
            open_database,
            save_as_database
        ])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            window.maximize().unwrap();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running NSL Tools Plus");
}
