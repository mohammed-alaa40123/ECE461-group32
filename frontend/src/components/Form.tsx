import {Button} from './ui/button'
import { LabeledSeparator } from "@/components/ui/separator"

export default function Form() {
  return (
    <form className="flex flex-col items-start justify-center text-white gap-10">
      <div className='flex flex-col mt-7'>
        <label htmlFor="name" className="mb-2">Search by ID</label>
        <input type="number" id="name" name="name" className="rounded text-black px-1"/>
      </div>
      <LabeledSeparator label="OR" className='self-center'/>
      <div className='flex flex-col'>
        <label htmlFor="name" className="mb-2">Search by Name</label>
        <input type="text" id="name" name="name" className="rounded text-black px-1"/>
      </div>
      <Button type = "submit" className="bg-white text-gray-900 self-end mt-3" variant="secondary">Submit</Button>
    </form>
  )
}