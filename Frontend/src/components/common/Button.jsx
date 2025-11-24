// Reusable Button Component

export const Button = ({ label, onClick, disabled = false, type = 'button', variant = 'primary' }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {label}
    </button>
  );
};

export default Button;
