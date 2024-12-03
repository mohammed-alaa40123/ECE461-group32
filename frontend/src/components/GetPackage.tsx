import React, { useState } from "react";
import { getPackageById, searchPackagesByRegEx } from "../api";
// import { Button } from "./ui/button";
import {downloadFile} from "../lib/utils";


const GetPackage: React.FC = () => {
  const [packageId, setPackageId] = useState("");
  const [regex, setRegex] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<"regex" | "id" | null>(null);
  const [inType, setInType] = useState(false);
  const [content, setContent] = useState<string | null>(null);
    const [name, setName] = useState<string | null>(null);


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
        setResult(JSON.stringify(data));
        setContent(data.data.Content);
        setName(data.metadata.Name);
      } else {
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
      const data = await searchPackagesByRegEx(regex);
      if (data) {
        setResult(JSON.stringify(data, null, 2));
      } else {
        throw new Error("No data found");
      }
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
            <button
              // role="Search by ID"
              onClick={() => {
                setSearchType("id");
                setInType(true);
              }}
              className="bg-blue-500 text-white p-3 rounded">
              Search by ID
            </button>
            <button
              // role="Search by Regex"
              // data-testid="search-by-regex-button"
              onClick={() => {
                setSearchType("regex");
                setInType(true);
              }}
              className="bg-blue-500 text-white p-3 rounded">
              Search by Regex
            </button>
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
                setName(null);
                setContent(null);
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
                  id="packageId"
                  type="text"
                  value={packageId}
                  onChange={(e) => setPackageId(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
                <button
                  // role = "Search"
                  onClick={handleGetPackageById}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4">
                  Search
                </button>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block font-bold mb-2" htmlFor="regex">
                  Package Regex
                </label>
                <input
                  id="regex"
                  type="text"
                  value={regex}
                  onChange={(e) => setRegex(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
                <button
                  // role = "Search"
                  onClick={handleSearchByRegex}
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-4">
                  Search
                </button>
              </div>
            )}
          </div>
        )}
        {loading && <p className="text-gray-700 italic">Loading...</p>}
        {error && <p className="text-red-500 italic">{error}</p>}
        {result && !content &&<code className=""><pre className="mx-auto text-white p-4 mt-4 rounded max-w-96 break-words whitespace-normal">{result}</pre></code>}
        {content && (
                <a
                    href={downloadFile(content, `${name?.replace(" ", "_")}.zip`).url}
                    download={`${name?.replace(" ", "_")}.zip`}
                    className="mt-4 px-6 py-3 bg-green-500 text-white rounded-lg"
                >
                    Click here to download
                </a>
            )}
      </div>
    </div>
  );
};

export default GetPackage;
