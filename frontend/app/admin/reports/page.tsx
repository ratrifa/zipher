"use client"

import { Input } from "@/components/ui/input"
import { TriangleAlert, ChevronDown, FolderOpen } from "lucide-react"

// Mock Data
const REPORTS_DATA = Array(6).fill(null).map((_, i) => ({
  id: i + 1,
  file: "video.mp4",
  owner: "Pa Aji",
  reason: "Berisi konten berbahaya",
  reportedBy: "Alivio The GOAT",
  time: "2m ago",
}))

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-normal text-slate-800">Reports</h1>
        <p className="text-[13px] text-blue-400">Reports</p>
      </div>

      <div className="flex-1 w-full xl:w-4/5 bg-white rounded-lg shadow-sm overflow-hidden p-6 pt-4 border border-slate-100">
        
        {/* Table Header Section */}
        <div className="flex items-center justify-between mb-4 mt-2">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer transition-colors">
            Search Filters <ChevronDown className="size-4" />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-blue-500 text-white text-[11px] font-bold px-4 py-1.5 rounded-sm tracking-wide shadow-sm">
              REPORT COUNT: 67
            </div>
            <Input 
              placeholder="Search Report..." 
              className="w-48 h-8 text-xs rounded-sm border-slate-200 focus-visible:ring-blue-100"
            />
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto rounded-md border border-slate-100 shadow-sm">
          <table className="w-full text-center text-xs text-slate-600 font-medium border-collapse">
            <thead>
              <tr className="border-b border-slate-200 uppercase text-slate-500 bg-slate-50/50">
                <th className="py-3 px-2 font-bold w-12">No</th>
                <th className="py-3 px-2 font-bold text-left">File</th>
                <th className="py-3 px-2 font-bold text-left">Owner</th>
                <th className="py-3 px-2 font-bold text-left">Reason</th>
                <th className="py-3 px-2 font-bold text-left">Reported By</th>
                <th className="py-3 px-2 font-bold text-left">Time</th>
                <th className="py-3 px-2 font-bold text-right w-[320px]">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {REPORTS_DATA.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-2 text-center text-slate-400">{item.id}</td>
                  <td className="py-3 px-2 text-left font-bold text-slate-700">{item.file}</td>
                  <td className="py-3 px-2 text-left text-[11px] font-semibold text-slate-600">{item.owner}</td>
                  <td className="py-3 px-2 text-left">
                     <span className="bg-rose-100 text-rose-700 px-2.5 py-1 rounded-sm text-[10px] font-bold tracking-wide uppercase">
                        {item.reason}
                     </span>
                  </td>
                  <td className="py-3 px-2 text-left text-[11px] text-slate-500">{item.reportedBy}</td>
                  <td className="py-3 px-2 text-left text-[11px] text-slate-500 font-medium">{item.time}</td>
                  
                  {/* Actions Column */}
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button className="bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-700 border border-slate-200 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm transition-all focus:ring-2 ring-slate-100 outline-none focus:outline-none">
                        Ignore
                       </button>
                       <button className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 hover:border-blue-200 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm transition-all flex items-center gap-1.5 focus:ring-2 ring-blue-100 outline-none focus:outline-none">
                        <FolderOpen className="size-3.5 fill-blue-600/20 stroke-blue-600" /> View file
                       </button>
                       <button className="bg-white hover:bg-red-50 text-red-500 border border-slate-200 hover:border-red-200 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm transition-all focus:ring-2 ring-red-100 outline-none focus:outline-none">
                        Delete
                       </button>
                       <button className="bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm transition-all flex items-center gap-1.5 focus:ring-2 ring-rose-100 outline-none focus:outline-none">
                        <TriangleAlert className="size-3.5 fill-white stroke-rose-600" /> Ban
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}
