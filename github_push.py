import os
import json
import subprocess
import tkinter as tk
from tkinter import messagebox, scrolledtext
import threading

# Cấu hình mặc định
REPO_URL = "https://github.com/dangdinhhoan/nsl-tools-plus.git"
TAURI_CONF_PATH = os.path.join("src-tauri", "tauri.conf.json")
CARGO_TOML_PATH = os.path.join("src-tauri", "Cargo.toml")
PACKAGE_JSON_PATH = "package.json"
VERSION_FILE = "version.txt"

def get_current_version():
    if os.path.exists(TAURI_CONF_PATH):
        try:
            with open(TAURI_CONF_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                if "package" in data and "version" in data["package"]: return data["package"]["version"]
                elif "version" in data: return data["version"]
        except Exception: pass
    if os.path.exists(PACKAGE_JSON_PATH):
        try:
            with open(PACKAGE_JSON_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                if "version" in data: return data["version"]
        except Exception: pass
    if os.path.exists(VERSION_FILE):
        try:
            with open(VERSION_FILE, "r", encoding="utf-8") as f:
                return f.read().strip()
        except Exception: pass
    return "0.1.0"

def save_version(new_version):
    log_messages = []
    if os.path.exists(TAURI_CONF_PATH):
        try:
            with open(TAURI_CONF_PATH, "r", encoding="utf-8") as f: data = json.load(f)
            if "package" in data and "version" in data["package"]: data["package"]["version"] = new_version
            else: data["version"] = new_version
            with open(TAURI_CONF_PATH, "w", encoding="utf-8") as f: json.dump(data, f, indent=2)
            log_messages.append("✓ Đã cập nhật src-tauri/tauri.conf.json")
        except Exception as e: log_messages.append(f"✗ Lỗi tauri.conf.json: {str(e)}")

    if os.path.exists(PACKAGE_JSON_PATH):
        try:
            with open(PACKAGE_JSON_PATH, "r", encoding="utf-8") as f: data = json.load(f)
            data["version"] = new_version
            with open(PACKAGE_JSON_PATH, "w", encoding="utf-8") as f: json.dump(data, f, indent=2)
            log_messages.append("✓ Đã cập nhật package.json")
        except Exception as e: log_messages.append(f"✗ Lỗi package.json: {str(e)}")

    if os.path.exists(CARGO_TOML_PATH):
        try:
            with open(CARGO_TOML_PATH, "r", encoding="utf-8") as f: lines = f.readlines()
            for i, line in enumerate(lines):
                if line.strip().startswith("version ="):
                    lines[i] = f'version = "{new_version}"\n'
                    break
            with open(CARGO_TOML_PATH, "w", encoding="utf-8") as f: f.writelines(lines)
            log_messages.append("✓ Đã cập nhật src-tauri/Cargo.toml")
        except Exception as e: log_messages.append(f"✗ Lỗi Cargo.toml: {str(e)}")

    try:
        with open(VERSION_FILE, "w", encoding="utf-8") as f: f.write(new_version)
    except Exception: pass
    return "\n".join(log_messages)

class GitHubUpdaterGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("NSL Tools Plus - Auto Deploy & Build")
        self.root.geometry("650x700")
        self.root.resizable(False, False)
        self.root.configure(bg="#f4f6f9")

        tk.Label(root, text="NSL TOOLS PLUS - GITHUB DEPLOYER", font=("Arial", 14, "bold"), fg="#1e293b", bg="#f4f6f9", pady=10).pack()

        # 1. Chế độ
        mode_frame = tk.LabelFrame(root, text=" 1. Chọn chế độ hành động ", font=("Arial", 10, "bold"), bg="#f4f6f9", padx=10, pady=10)
        mode_frame.pack(fill="x", padx=15, pady=5)
        self.action_mode = tk.StringVar(value="update")
        tk.Radiobutton(mode_frame, text="Cập nhật (Đẩy các thay đổi tiếp theo lên GitHub)", variable=self.action_mode, value="update", font=("Arial", 10), bg="#f4f6f9", fg="#2563eb").pack(anchor="w", pady=2)
        tk.Radiobutton(mode_frame, text="Tạo mới hoàn toàn (Khởi tạo Git & Push lần đầu)", variable=self.action_mode, value="create_new", font=("Arial", 10), bg="#f4f6f9", fg="#dc2626").pack(anchor="w", pady=2)

        # 2. Phiên bản
        version_frame = tk.LabelFrame(root, text=" 2. Quản lý phiên bản phần mềm ", font=("Arial", 10, "bold"), bg="#f4f6f9", padx=10, pady=10)
        version_frame.pack(fill="x", padx=15, pady=5)
        tk.Label(version_frame, text="Phiên bản hiện tại:", font=("Arial", 10), bg="#f4f6f9").grid(row=0, column=0, sticky="w", pady=5)
        self.lbl_curr_version = tk.Label(version_frame, text=get_current_version(), font=("Arial", 10, "bold"), fg="#059669", bg="#f4f6f9")
        self.lbl_curr_version.grid(row=0, column=1, sticky="w", padx=10, pady=5)

        tk.Label(version_frame, text="Phiên bản mới:", font=("Arial", 10), bg="#f4f6f9").grid(row=1, column=0, sticky="w", pady=5)
        self.ent_new_version = tk.Entry(version_frame, font=("Arial", 10), width=15)
        self.ent_new_version.insert(0, get_current_version())
        self.ent_new_version.grid(row=1, column=1, sticky="w", padx=10, pady=5)
        tk.Button(version_frame, text="Tự tăng bản vá (+0.0.1)", command=self.auto_increment_patch, font=("Arial", 9), bg="#e2e8f0").grid(row=1, column=2, padx=5, pady=5)

        # 3. Nội dung & Build Option
        commit_frame = tk.LabelFrame(root, text=" 3. Cấu hình Push & Build ", font=("Arial", 10, "bold"), bg="#f4f6f9", padx=10, pady=10)
        commit_frame.pack(fill="x", padx=15, pady=5)
        
        tk.Label(commit_frame, text="Nhập lời nhắn ngắn gọn về lần cập nhật này:", font=("Arial", 10), bg="#f4f6f9").pack(anchor="w", pady=2)
        self.ent_commit = tk.Entry(commit_frame, font=("Arial", 10), width=75)
        self.ent_commit.pack(fill="x", pady=5)
        self.ent_commit.insert(0, "Cập nhật tính năng phần mềm")

        # Checkbox Trigger Build
        self.trigger_build = tk.BooleanVar(value=True)
        chk_build = tk.Checkbutton(commit_frame, text="Kích hoạt tự động Build ứng dụng trên GitHub (Tạo Tag phiên bản)", variable=self.trigger_build, font=("Arial", 10, "bold"), bg="#f4f6f9", fg="#d97706")
        chk_build.pack(anchor="w", pady=10)

        # Nút Push
        self.btn_push = tk.Button(root, text="🚀 PUSH & XỬ LÝ LÊN GITHUB", command=self.start_push_thread, font=("Arial", 11, "bold"), bg="#2563eb", fg="white", activebackground="#1d4ed8", activeforeground="white", height=2)
        self.btn_push.pack(fill="x", padx=15, pady=10)

        # Log
        log_frame = tk.LabelFrame(root, text=" Tiến trình thực thi (Console Log) ", font=("Arial", 10, "bold"), bg="#f4f6f9")
        log_frame.pack(fill="both", expand=True, padx=15, pady=5)
        self.log_area = scrolledtext.ScrolledText(log_frame, font=("Consolas", 9), bg="#1e1e1e", fg="#f1f1f1", insertbackground="white")
        self.log_area.pack(fill="both", expand=True, padx=5, pady=5)
        self.append_log("Hệ thống đã sẵn sàng.\n")

    def auto_increment_patch(self):
        try:
            curr = self.ent_new_version.get().strip()
            parts = curr.split('.')
            if len(parts) == 3:
                parts[2] = str(int(parts[2]) + 1)
                self.ent_new_version.delete(0, tk.END)
                self.ent_new_version.insert(0, ".".join(parts))
        except Exception: pass

    def append_log(self, text):
        self.log_area.insert(tk.END, text)
        self.log_area.see(tk.END)

    def run_command(self, cmd, allow_fail=False):
        self.append_log(f"> {cmd}\n")
        process = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        stdout, stderr = process.communicate()
        if stdout: self.append_log(stdout)
        if stderr and process.returncode != 0:
            self.append_log(f"[LỖI/CẢNH BÁO] {stderr}")
            if not allow_fail: return False
        return True

    def start_push_thread(self):
        self.btn_push.config(state=tk.DISABLED, text="⏳ ĐANG XỬ LÝ... VUI LÒNG ĐỢI")
        threading.Thread(target=self.execute_deploy, daemon=True).start()

    def execute_deploy(self):
        mode = self.action_mode.get()
        new_ver = self.ent_new_version.get().strip()
        commit_msg = self.ent_commit.get().strip()

        if not new_ver:
            messagebox.showerror("Lỗi", "Vui lòng nhập số phiên bản!")
            self.reset_button()
            return

        self.append_log("----------------------------------------\n")
        self.append_log(f"🔄 Lưu phiên bản mới: {new_ver}\n")
        self.append_log(save_version(new_ver) + "\n")
        self.lbl_curr_version.config(text=new_ver)

        success = True
        commit_msg_full = f"Cập nhật v{new_ver}: {commit_msg}" if commit_msg else f"Cập nhật phiên bản v{new_ver}"

        # Đẩy code lên Git
        if mode == "create_new":
            self.append_log("⚡ Đang chạy: TẠO MỚI HOÀN TOÀN...\n")
            if not self.run_command("git init"): success = False
            if success and not self.run_command("git add ."): success = False
            if success and not self.run_command(f'git commit -m "{commit_msg_full}"'): success = False
            if success and not self.run_command("git branch -M main"): success = False
            subprocess.run("git remote remove origin", shell=True, capture_output=True)
            if success and not self.run_command(f"git remote add origin {REPO_URL}"): success = False
            if success and not self.run_command("git push -u origin main"): success = False
        else:
            self.append_log("⚡ Đang chạy: CẬP NHẬT CODE...\n")
            if not self.run_command("git add ."): success = False
            if success and not self.run_command(f'git commit -m "{commit_msg_full}"'): success = False
            if success and not self.run_command("git push"): success = False

        # Xử lý Trigger Build (Tạo Tag)
        if success and self.trigger_build.get():
            self.append_log(f"\n⚙️ ĐANG KÍCH HOẠT NHÀ MÁY BUILD (Tạo Tag v{new_ver})...\n")
            # Tạo tag local (cho phép fail nếu tag đã tồn tại để chạy tiếp)
            self.run_command(f"git tag v{new_ver}", allow_fail=True)
            # Push tag lên GitHub (chính hành động này kích hoạt workflow release.yml)
            if not self.run_command(f"git push origin v{new_ver}"):
                self.append_log("⚠️ Không thể đẩy Tag lên. Có thể Tag này đã tồn tại trên GitHub.\n")
            else:
                self.append_log("✅ Đã phát lệnh Build thành công! GitHub đang tự động biên dịch .exe.\n")

        self.append_log("----------------------------------------\n")
        if success:
            msg = f"Đã cập nhật code lên GitHub!\n\nPhiên bản: {new_ver}"
            if self.trigger_build.get():
                msg += "\n\nGitHub Actions đã được kích hoạt. Hãy lên trang web GitHub phần 'Actions' để xem tiến độ Build."
            messagebox.showinfo("Hoàn tất", msg)
        else:
            messagebox.showerror("Lỗi", "Có lỗi xảy ra, vui lòng kiểm tra Console Log.")

        self.reset_button()

    def reset_button(self):
        self.btn_push.config(state=tk.NORMAL, text="🚀 PUSH & XỬ LÝ LÊN GITHUB")

if __name__ == "__main__":
    root = tk.Tk()
    app = GitHubUpdaterGUI(root)
    root.mainloop()