import { useState } from 'react';
import { Button } from './ui/button'; // Assuming Button is a named export
import ToggleSwitch from './ui/toggle'; // Assuming ToggleButton is a named export

export default function Form(): JSX.Element {
  const [ToggleLabel, setToggleLabel] = useState("ID");
  return (
    <form className="flex flex-col items-start justify-center text-white gap-10" role="form">
          <ToggleSwitch onToggle={(state) => setToggleLabel(state ? "Name" : "ID")} label="Search by ID" labelAfter="Search by Name" className="mx-auto"/>
          <div className='flex flex-col'>
            <label htmlFor="number" className="mb-2">Search by {ToggleLabel}</label>
            <input
               type={ToggleLabel === "ID" ? "number" : "text"}
               id={ToggleLabel === "ID" ? "number" : "name"}
               name={ToggleLabel === "ID" ? "number" : "name"}
               className="rounded text-black px-1"/>
          </div>
      <Button
        type="submit"
        className="bg-white text-gray-900 self-end mt-3 px-2 py-1 rounded"
        text="Search"
      />
    </form>
  );
}
