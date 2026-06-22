import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPen, faTrash, faStar, faChevronDown, faChevronRight, faChevronLeft,
  faCheck, faXmark, faArrowsRotate, faDownload, faUpload, faGear,
  faMountainSun, faThumbTack, faPlus,
} from '@fortawesome/free-solid-svg-icons'
import { faStar as faStarOutline, faSquareCheck } from '@fortawesome/free-regular-svg-icons'

type Props = { size?: number; className?: string }

const s = (size: number) => ({ fontSize: size, width: '1em' })

export function PenIcon({ size = 10, className }: Props) {
  return <FontAwesomeIcon icon={faPen} style={s(size)} className={className} />
}

export function TrashIcon({ size = 14, className }: Props) {
  return <FontAwesomeIcon icon={faTrash} style={s(size)} className={className} />
}

export function StarIcon({ size = 10, className }: Props) {
  return <FontAwesomeIcon icon={faStar} style={s(size)} className={className} />
}

export function StarOutlineIcon({ size = 10, className }: Props) {
  return <FontAwesomeIcon icon={faStarOutline} style={s(size)} className={className} />
}

export function ChevronDownIcon({ size = 10, className }: Props) {
  return <FontAwesomeIcon icon={faChevronDown} style={s(size)} className={className} />
}

export function ChevronRightIcon({ size = 10, className }: Props) {
  return <FontAwesomeIcon icon={faChevronRight} style={s(size)} className={className} />
}

export function ChevronLeftIcon({ size = 10, className }: Props) {
  return <FontAwesomeIcon icon={faChevronLeft} style={s(size)} className={className} />
}

export function CheckIcon({ size = 10, className }: Props) {
  return <FontAwesomeIcon icon={faCheck} style={s(size)} className={className} />
}

export function XmarkIcon({ size = 10, className }: Props) {
  return <FontAwesomeIcon icon={faXmark} style={s(size)} className={className} />
}

export function RecycleIcon({ size = 10, className }: Props) {
  return <FontAwesomeIcon icon={faArrowsRotate} style={s(size)} className={className} />
}

export function CheckboxIcon({ size = 10, className }: Props) {
  return <FontAwesomeIcon icon={faSquareCheck} style={s(size)} className={className} />
}

export function DownloadIcon({ size = 10, className }: Props) {
  return <FontAwesomeIcon icon={faDownload} style={s(size)} className={className} />
}

export function UploadIcon({ size = 10, className }: Props) {
  return <FontAwesomeIcon icon={faUpload} style={s(size)} className={className} />
}

export function GearIcon({ size = 10, className }: Props) {
  return <FontAwesomeIcon icon={faGear} style={s(size)} className={className} />
}

export function MountainIcon({ size = 10, className }: Props) {
  return <FontAwesomeIcon icon={faMountainSun} style={s(size)} className={className} />
}

export function PinIcon({ size = 10, className }: Props) {
  return <FontAwesomeIcon icon={faThumbTack} style={s(size)} className={className} />
}

export function PlusIcon({ size = 10, className }: Props) {
  return <FontAwesomeIcon icon={faPlus} style={s(size)} className={className} />
}
