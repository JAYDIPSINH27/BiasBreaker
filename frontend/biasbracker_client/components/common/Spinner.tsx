import { ImSpinner2 } from "react-icons/im"
import cn from 'classnames'

interface SpinnerProps {
    sm?: boolean;
    md?: boolean;
    lg?: boolean;
}

const Spinner = ({sm,md,lg}: SpinnerProps) => {

    const classnames= cn('animate-spin text-white-300 fill-white-300 mr-2',{
    'w-4 h-4': sm,
    'w-6 h-6': md,
    'w-8 h-8': lg
    })

  return (
   <div role='status'>
    <ImSpinner2 className='classnames' />
    <span className="sr-only">Loading...</span>
   </div>
  )
}

export default Spinner