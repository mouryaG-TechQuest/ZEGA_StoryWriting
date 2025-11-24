// Sidebar Layout Component

export const Sidebar = ({ isOpen = true }) => {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <nav className="sidebar-nav">
        <ul>
          <li><a href="/">Dashboard</a></li>
          <li><a href="/profile">Profile</a></li>
          <li><a href="/settings">Settings</a></li>
          <li><a href="/logout">Logout</a></li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
