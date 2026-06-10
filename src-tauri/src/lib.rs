use tauri::Manager;
use tauri_plugin_dialog::DialogExt;
use serde::Deserialize;
use std::fs;
use std::path::PathBuf;

mod commands;

const GITHUB_REPO: &str = "dangdinhhoan/nsl-tools-plus";
const CURRENT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[derive(Deserialize, Debug)]
struct GithubRelease {
    tag_name: String,
    assets: Vec<GithubAsset>,
}

#[derive(Deserialize, Debug)]
struct GithubAsset {
    name: String,
    browser_download_url: String,
}

#[tauri::command]
fn get_current_version() -> String {
    CURRENT_VERSION.to_string()
}

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

#[tauri::command]
async fn check_update() -> Result<Option<UpdateInfo>, String> {
    let url = format!(
        "https://api.github.com/repos/{}/releases/latest",
        GITHUB_REPO
    );

    let client = reqwest::Client::builder()
        .user_agent("NSL-Tools-Plus-Updater")
        .timeout(std::time::Duration::from_secs(5))
        .connect_timeout(std::time::Duration::from_secs(3))
        .build()
        .map_err(|e| format!("Lỗi tạo client: {}", e))?;

    let release: GithubRelease = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Không thể kết nối GitHub: {}", e))?
        .json()
        .await
        .map_err(|e| format!("Lỗi parse JSON: {}", e))?;

    let latest_tag = release.tag_name.trim_start_matches('v');
    let current = CURRENT_VERSION;

    if latest_tag != current {
        // Tìm asset .exe hoặc .msi
        let installer = release.assets.iter().find(|a| {
            a.name.ends_with(".exe") || a.name.ends_with(".msi")
        });

        Ok(Some(UpdateInfo {
            version: latest_tag.to_string(),
            current_version: current.to_string(),
            download_url: installer
                .map(|a| a.browser_download_url.clone())
                .unwrap_or_default(),
        }))
    } else {
        Ok(None)
    }
}

#[tauri::command]
async fn download_and_install(download_url: String) -> Result<(), String> {
    let client = reqwest::Client::builder()
        .user_agent("NSL-Tools-Plus-Updater")
        .timeout(std::time::Duration::from_secs(5))
        .connect_timeout(std::time::Duration::from_secs(3))
        .build()
        .map_err(|e| format!("Lỗi tạo client: {}", e))?;

    // Tạo temp file
    let tmp_dir = std::env::temp_dir();
    let ext = if download_url.ends_with(".msi") { "msi" } else { "exe" };
    let tmp_path: PathBuf = tmp_dir.join(format!("NSL_Tools_Plus_Update.{}", ext));

    // Download
    let response = client
        .get(&download_url)
        .send()
        .await
        .map_err(|e| format!("Lỗi tải file: {}", e))?;

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Lỗi đọc dữ liệu: {}", e))?;

    fs::write(&tmp_path, &bytes).map_err(|e| format!("Lỗi ghi file: {}", e))?;

    // Mở installer
    open::that(&tmp_path).map_err(|e| format!("Lỗi mở installer: {}", e))?;

    // Đợi một chút rồi thoát app
    tokio::time::sleep(std::time::Duration::from_millis(500)).await;
    std::process::exit(0);
}

#[derive(serde::Serialize, Clone)]
struct UpdateInfo {
    version: String,
    current_version: String,
    download_url: String,
}

fn create_empty_db(path: &str) -> Result<(), Box<dyn std::error::Error>> {
    let conn = rusqlite::Connection::open(path)?;
    conn.execute_batch("
        CREATE TABLE IF NOT EXISTS thongtintruong (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            don_vi_chu_quan TEXT DEFAULT '',
            ten_truong TEXT DEFAULT '',
            nam_hoc TEXT NOT NULL,
            ghi_chu TEXT DEFAULT '',
            hieu_truong TEXT DEFAULT '',
            pho_hieu_truong_1 TEXT DEFAULT '',
            pho_hieu_truong_2 TEXT DEFAULT '',
            UNIQUE(nam_hoc)
        );
    ")?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            new_database,
            open_database,
            save_as_database,
            get_current_version,
            check_update,
            download_and_install,
            commands::get_nam_hoc_list_truong,
            commands::get_thong_tin_truong,
            commands::save_thong_tin_truong,
            commands::add_nam_hoc_truong,
            commands::delete_nam_hoc_truong,
            commands::get_giao_vien_list,
            commands::save_giao_vien_list,
            commands::delete_all_giao_vien,
            commands::get_excel_sheets,
            commands::get_excel_columns,
            commands::import_excel_rows
        ])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            window.maximize().unwrap();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running NSL Tools Plus");
}
