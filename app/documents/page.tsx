"use client";

import React, { useState, useEffect } from "react";

type FileDoc = {
  _id: string;
  name: string;
  size: number;
  type: string;
  createdAt: string;
};

export default function DocumentDrive(): React.JSX.Element {
  const [files, setFiles] = useState<FileDoc[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => { fetchFiles(); }, []);

  const fetchFiles = async () => {
    const res = await fetch("/api/documents");
    const data = await res.json();
    if (data.files) setFiles(data.files);
  };

  // --- DOWNLOAD FEATURE ---
  const downloadFile = async (id: string, fileName: string) => {
    const res = await fetch(`/api/documents?id=${id}&download=true`);
    const data = await res.json();
    
    // Create a temporary link to trigger the download
    const link = document.createElement("a");
    link.href = data.content; // The Base64 string
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- UPLOAD (CREATE) ---
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadToServer(file);
  };

  // --- REWRITE (UPDATE) ---
  const rewriteFile = async (id: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) uploadToServer(file, id);
    };
    input.click();
  };

  const uploadToServer = async (file: File, id?: string) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const method = id ? "PUT" : "POST";
      await fetch("/api/documents", {
        method,
        body: JSON.stringify({
          id, // Only for PUT
          name: file.name,
          type: file.type,
          size: file.size,
          content: reader.result,
        }),
      });
      setIsProcessing(false);
      fetchFiles();
    };
    reader.readAsDataURL(file);
  };

  const deleteFile = async (id: string) => {
    await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
    fetchFiles();
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">My Drive</h1>

        <div className="mb-8 p-10 border-2 border-dashed border-slate-300 rounded-3xl bg-white flex flex-col items-center justify-center">
          <input type="file" id="file-upload" className="hidden" onChange={handleUpload} disabled={isProcessing} />
          <label htmlFor="file-upload" className="cursor-pointer bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-blue-700">
            {isProcessing ? "Processing..." : "Upload New File"}
          </label>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold">Name</th>
                <th className="px-6 py-4 text-sm font-semibold">Size</th>
                <th className="px-6 py-4 text-sm font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {files.map((file) => (
                <tr key={file._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{file.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB</td>
                  <td className="px-6 py-4 text-right space-x-4">
                    <button onClick={() => downloadFile(file._id, file.name)} className="text-blue-600 font-bold text-sm">Download</button>
                    <button onClick={() => rewriteFile(file._id)} className="text-emerald-600 font-bold text-sm">Rewrite</button>
                    <button onClick={() => deleteFile(file._id)} className="text-red-500 font-bold text-sm">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}