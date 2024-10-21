import React from 'react'
import { Button } from './ui/button'
import { LabeledSeparator } from "./ui/separator"

export default function Form() {
  return (
    <form className="flex flex-col items-start justify-center text-white gap-10" role="form">
      <div className='flex flex-col mt-7'>
        <label htmlFor="number" className="mb-2">Search by ID</label>
        <input type="number" id="number" name="number" className="rounded text-black px-1"/>
      </div>
      <LabeledSeparator label="OR" className='self-center'/>
      <div className='flex flex-col'>
        <label htmlFor="name" className="mb-2">Search by Name</label>
        <input type="text" id="name" name="name" className="rounded text-black px-1"/>
      </div>
      <Button type = "submit" className="bg-white text-gray-900 self-end mt-3" variant="secondary">Search</Button>
    </form>
  )
}