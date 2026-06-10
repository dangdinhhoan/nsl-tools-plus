import React, { useState } from "react";
import type { MenuGroup } from "../App";
import {
  Table,
  User,
  Ban,
  Star,
  BookOpen,
  ClipboardCheck,
  Info,
  Calculator,
  List,
  School,
  Users,
  Book,
  DoorOpen,
  Calendar,
  Clock,
  CalendarOff,
  CalendarDays,
  Briefcase,
  UserCheck,
  Hash,
  Ellipsis,
  Sparkles,
  FilePlus,
  FolderOpen,
  Save,
  Database,
  ChevronDown,
  PanelLeftClose,
} from "lucide-react";
import "./Sidebar.css";

interface SidebarProps {
  menuGroups: MenuGroup[];
  activeItem: string | null;
  onSelectItem: (label: string) => void;
  dbPath: string | null;
  onNewDb: () => void;
  onOpenDb: () => void;
  onSaveAsDb: () => void;
  updateStatus: "checking" | "up-to-date" | "available" | "error";
  updateVersion: string | null;
  onUpdateNow: () => void;
}

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  table: Table,
  user: User,
  ban: Ban,
  star: Star,
  "book-open": BookOpen,
  "clipboard-check": ClipboardCheck,
  info: Info,
  calculator: Calculator,
  list: List,
  school: School,
  users: Users,
  book: Book,
  "door-open": DoorOpen,
  calendar: Calendar,
  clock: Clock,
  "calendar-off": CalendarOff,
  "calendar-star": CalendarDays,
  briefcase: Briefcase,
  "user-check": UserCheck,
  hash: Hash,
  ellipsis: Ellipsis,
};

const groupIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  "Phụ trội": Star,
  "Chấm công": ClipboardCheck,
  "Hòa nhập": Users,
  "Thông tin": Info,
};

const groupColors: Record<string, string> = {
  "Thông tin": "#b45309",
  "Phụ trội": "#6d28d9",
  "Chấm công": "#1d4ed8",
  "Hòa nhập": "#059669",
};

const Sidebar: React.FC<SidebarProps> = ({
  menuGroups,
  activeItem,
  onSelectItem,
  dbPath,
  onNewDb,
  onOpenDb,
  onSaveAsDb,
  updateStatus,
  updateVersion,
  onUpdateNow,
}) => {
  const [expandedGroup, setExpandedGroup] = useState<string>("csdl");
  const [collapsed, setCollapsed] = useState(false);

  const handleToggleGroup = (header: string) => {
    setExpandedGroup(prev => (prev === header ? "" : header));
  };

  return (
    <aside className={`sidebar glass ${collapsed ? "sidebar-collapsed" : ""}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-header-top">
          <div
            className="sidebar-logo"
            onClick={() => { if (collapsed) setCollapsed(false); }}
            style={{ cursor: collapsed ? "pointer" : "default" }}
          >
            <div className="logo-icon">
              <Sparkles size={24} />
            </div>
            <div className="logo-text">
              <span className="logo-title">NSL Tools</span>
              <span className="logo-plus">Plus</span>
            </div>
          </div>
          {!collapsed && (
            <button
              className="sidebar-toggle-btn"
              onClick={() => setCollapsed(true)}
              title="Thu gọn sidebar"
            >
              <PanelLeftClose size={18} />
            </button>
          )}
        </div>
        <div className="sidebar-subtitle">Quản lý nhà trường</div>
      </div>

      {/* Separator */}
      <div className="sidebar-separator" />

      {/* Database Actions - grouped like menu */}
      <div className="menu-group">
        <button
          className={`menu-group-header ${expandedGroup === "csdl" ? "header-expanded" : ""}`}
          onClick={() => handleToggleGroup("csdl")}
          style={{ "--group-color": "#2563eb" } as React.CSSProperties}
        >
          <div className="group-indicator" />
          <span className="group-icon"><Database size={15} /></span>
          <span className="group-title">Cơ sở dữ liệu</span>
          <ChevronDown
            size={14}
            className={`group-chevron ${expandedGroup === "csdl" ? "chevron-rotated" : ""}`}
          />
        </button>
        <div className={`menu-group-items ${expandedGroup === "csdl" ? "items-expanded" : "items-collapsed"}`}>
          <button className="menu-item" onClick={onNewDb}>
            <span className="menu-item-icon"><FilePlus size={16} /></span>
            <span className="menu-item-label">Tạo mới</span>
          </button>
          <button className="menu-item" onClick={onOpenDb}>
            <span className="menu-item-icon"><FolderOpen size={16} /></span>
            <span className="menu-item-label">Mở file</span>
          </button>
          <button className="menu-item" onClick={onSaveAsDb} disabled={!dbPath} style={!dbPath ? { opacity: 0.4, cursor: "not-allowed", pointerEvents: "none" } : undefined}>
            <span className="menu-item-icon"><Save size={16} /></span>
            <span className="menu-item-label">Lưu tên khác</span>
          </button>
        </div>
      </div>

      {/* Current DB path indicator - NOT in group */}
      <div className={`sidebar-db-path ${dbPath ? "has-path" : ""}`}>
        {dbPath ? (
          <span className="db-path-text" title={dbPath}>{dbPath}</span>
        ) : (
          <span className="db-path-empty">Chưa mở CSDL</span>
        )}
      </div>

      <div className="sidebar-separator" />

      {/* Collapsed: show group icon shortcuts */}
      {collapsed && (
        <nav className="sidebar-collapsed-nav">
          {/* CSDL shortcut */}
          <button
            className={`collapsed-group-btn ${expandedGroup === "csdl" ? "collapsed-group-active" : ""}`}
            onClick={() => {
              setCollapsed(false);
              setExpandedGroup("csdl");
            }}
            title="Cơ sở dữ liệu"
            style={{ "--group-color": "#2563eb" } as React.CSSProperties}
          >
            <Database size={20} />
          </button>
          {menuGroups.map((group) => {
            const GroupIcon = groupIcons[group.header];
            const color = groupColors[group.header] || "#64748b";
            const isExpanded = expandedGroup === group.header;
            return (
              <button
                key={group.header}
                className={`collapsed-group-btn ${isExpanded ? "collapsed-group-active" : ""}`}
                onClick={() => {
                  setCollapsed(false);
                  setExpandedGroup(group.header);
                }}
                title={group.header}
                style={{ "--group-color": color } as React.CSSProperties}
              >
                {GroupIcon && <GroupIcon size={20} />}
              </button>
            );
          })}
        </nav>
      )}

      {/* Menu */}
      <nav className="sidebar-nav">
        {menuGroups.map((group) => {
          const GroupIcon = groupIcons[group.header];
          const color = groupColors[group.header] || "#64748b";
          const isExpanded = expandedGroup === group.header;

          return (
            <div
              key={group.header}
              className={`menu-group ${isExpanded ? "menu-group-expanded" : ""}`}
              style={{ "--group-color": color } as React.CSSProperties}
            >
              {/* Group header - clickable */}
              <button
                className={`menu-group-header ${isExpanded ? "header-expanded" : ""}`}
                onClick={() => handleToggleGroup(group.header)}
              >
                <div className="group-indicator" />
                {GroupIcon && (
                  <span className="group-icon">
                    <GroupIcon size={15} />
                  </span>
                )}
                <span className="group-title">
                  {group.header}
                </span>
                <ChevronDown
                  size={14}
                  className={`group-chevron ${isExpanded ? "chevron-rotated" : ""}`}
                />
              </button>

              {/* Group items */}
              <div className={`menu-group-items ${isExpanded ? "items-expanded" : "items-collapsed"}`}>
                {group.items.map((item) => {
                  const Icon = iconMap[item.icon];
                  const isActive = activeItem === item.label;

                  return (
                    <button
                      key={item.label}
                      className={`menu-item ${isActive ? "menu-item-active" : ""}`}
                      onClick={() => onSelectItem(item.label)}
                    >
                      <span className="menu-item-icon">
                        {Icon && <Icon size={16} />}
                      </span>
                      <span className="menu-item-label">{item.label}</span>
                      {isActive && <span className="active-dot" />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {dbPath && (
          <div className="sidebar-version-info">
            <span className="version-status has-db" title={dbPath}>{dbPath.split(/[\\\/]/).pop()}</span>
          </div>
        )}
        <div className="sidebar-version-info">
          {updateStatus === "available" && updateVersion ? (
            <button className="version-update-btn" onClick={onUpdateNow} title="Bấm để cập nhật">
              v1.0.2 → Có bản mới v{updateVersion}! <span className="update-now-link">Cập nhật ngay</span>
            </button>
          ) : updateStatus === "up-to-date" ? (
            <span className="version-status">v1.0.2 — Đã là phiên bản mới nhất</span>
          ) : updateStatus === "checking" ? (
            <span className="version-status">v1.0.2 — Đang kiểm tra cập nhật...</span>
          ) : (
            <span className="version-status">v1.0.2</span>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
