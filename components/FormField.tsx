interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: { value: string; label: string }[]
}

const inputStyle = {
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  color: 'var(--text)',
  padding: '6px 10px',
  fontSize: '0.8rem',
  width: '100%',
  outline: 'none',
}

export function InputField({ label, ...props }: InputProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <input style={inputStyle} {...props} />
    </label>
  )
}

export function SelectField({ label, options, ...props }: SelectProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <select style={inputStyle} {...props}>
        <option value="">選択してください</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}

export function TextareaField({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '64px' }} {...props} />
    </label>
  )
}

export function SubmitButton({ children }: { children: string }) {
  return (
    <button type="submit"
      className="w-full py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
      style={{ background: 'var(--accent)', color: '#fff' }}>
      {children}
    </button>
  )
}
