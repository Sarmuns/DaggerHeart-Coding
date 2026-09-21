// Small icon-only button, used for the room header actions.
function IconButton({ children, onClick, label, title }) {
  return (
    <button
      type="button"
      className="secundario config-button"
      onClick={onClick}
      aria-label={label}
      title={title}
    >
      {children}
    </button>
  )
}

export default IconButton
