import { File, FileText } from "lucide-react"

export type IconName = "docx" | "pdf"

const icons = {
  docx: File,
  pdf: FileText
}

interface IconProps extends React.HTMLAttributes<HTMLDivElement> {
  name: IconName
  size?: number
}

export function Icon({ name, size = 16, ...props }: IconProps) {
  const LucideIcon = icons[name]
  return (
    <div {...props}>
      <LucideIcon size={size} />
    </div>
  )
} 