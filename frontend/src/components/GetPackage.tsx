import React, { useState } from "react";
import { getPackageById, searchPackagesByRegEx } from "../api";
import { Button } from "./ui/button";

const GetPackage: React.FC = () => {
  const [packageId, setPackageId] = useState("");
  const [regex, setRegex] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<"regex" | "id" | null>(null);
  const [inType, setInType] = useState(false);
  const handleGetPackageById = async () => {
    if (!packageId) {
      setError("Package ID cannot be empty");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      console.log(packageId);
      const data = await getPackageById(packageId);
      if (data) {
        setResult(JSON.stringify(data, null, 2));
        console.log(data);
        console.log(result);
      }
      else {
        throw new Error("No data found");
      }
    } catch (err) {
      setError("Failed to get package by ID");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByRegex = async () => {
    if (!regex) {
      setError("Regex cannot be empty");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await searchPackagesByRegEx(regex, localStorage.getItem("authToken") ?? "");
      setResult(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(err);
      setError("Failed to search packages by regex");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white bg-gray-900 py-7 px-60 flex flex-col items-center">
      <div className="flex flex-col gap-5">
        {!inType && (
          <div className="flex gap-10 justify-center">
            <Button
              text="Search by ID"
              onClick={() => {
                setSearchType("id");
                setInType(true);
              }}
              className="bg-blue-500 text-white p-3 rounded"
            />
            <Button
              text="Search by Regex"
              onClick={() => {
                setSearchType("regex");
                setInType(true);
              }}
              className="bg-blue-500 text-white p-3 rounded"
            />
          </div>
        )}
        {inType && (
          <div>
            <button
              onClick={() => {
                setSearchType(null);
                setInType(false);
                setPackageId("");
                setRegex("");
                setError(null);
                setResult(null);
              }}
              className="bg-gray-800 mb-10 hover:opacity-90 text-white py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4">
              Back
            </button>
            {searchType === "id" ? (
              <div className="mb-4">
                <label className="block font-bold mb-2" htmlFor="packageId">
                  Package ID
                </label>
                <input
                  id="id"
                  type="text"
                  value={packageId}
                  onChange={(e) => setPackageId(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
                <button
                  onClick={handleGetPackageById}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4">
                  Get Package by ID
                </button>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block font-bold mb-2" htmlFor="regex">
                  Search by Regex
                </label>
                <input
                  id="regex"
                  type="text"
                  value={regex}
                  onChange={(e) => setRegex(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
                <button
                  onClick={handleSearchByRegex}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4">
                  Search by Regex
                </button>
              </div>
            )}
          </div>
        )}
        {loading && <p className="text-gray-700 italic">Loading...</p>}
        {error && <p className="text-red-500 italic">{error}</p>}
        {result && <pre className="text-white p-4 mt-4 rounded">{result}</pre>}
      </div>
    </div>
  );
};

export default GetPackage;
