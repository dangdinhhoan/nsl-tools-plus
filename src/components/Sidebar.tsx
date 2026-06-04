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
  const [expandedGroup, setExpandedGroup] = useState<string>("");
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

      {/* Database Actions */}
      <div className="sidebar-db-actions">
        <button className="db-action-btn" title="Tạo mới CSDL" onClick={onNewDb}>
          <FilePlus size={16} />
          <span>Tạo mới</span>
        </button>
        <button className="db-action-btn" title="Mở CSDL" onClick={onOpenDb}>
          <FolderOpen size={16} />
          <span>Mở file</span>
        </button>
        <button className="db-action-btn" title="Lưu tên khác" onClick={onSaveAsDb} disabled={!dbPath}>
          <Save size={16} />
          <span>Lưu tên khác</span>
        </button>
      </div>

      {/* Current DB path indicator */}
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
        <div className="sidebar-version-info">
          {dbPath ? (
            <span className="version-status has-db" title={dbPath}>{dbPath.split(/[\\\/]/).pop()}</span>
          ) : updateStatus === "available" && updateVersion ? (
            <button className="version-update-btn" onClick={onUpdateNow} title="Bấm để cập nhật">
              v1.0.1 → Có bản mới v{updateVersion}! <span className="update-now-link">Cập nhật ngay</span>
            </button>
          ) : updateStatus === "up-to-date" ? (
            <span className="version-status">v1.0.1 — Đã là phiên bản mới nhất</span>
          ) : updateStatus === "checking" ? (
            <span className="version-status">v1.0.1 — Đang kiểm tra cập nhật...</span>
          ) : (
            <span className="version-status">v1.0.1</span>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
