"use client"

import { useState } from "react"
import { Users, Inbox, TriangleAlert, Siren, History, X } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

export default function AdminDashboardPage() {
  const [activeModal, setActiveModal] = useState<"reports" | "activity" | null>(null)

  return (
    <div className="flex flex-col gap-8 p-8 md:p-10 relative">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-normal text-slate-800">Selamat Datang Super Admin</h1>
        <p className="text-[13px] text-blue-400">Dashboard</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {/* Card 1 */}
        <Card className="shadow-sm rounded-xl border-slate-200/60 h-32 flex items-center">
          <CardContent className="p-6 flex items-center justify-between w-full h-full">
            <div className="flex flex-col justify-center gap-1">
              <p className="text-[13px] font-medium text-slate-500">Users:</p>
              <h2 className="text-2xl font-bold text-slate-700">1.234</h2>
            </div>
            <div className="bg-white">
              <Users className="size-12 rounded-sm text-green-500 fill-green-500" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2 */}
        <Card className="shadow-sm rounded-xl border-slate-200/60 h-32 flex items-center">
          <CardContent className="p-6 flex items-center justify-between w-full h-full">
            <div className="flex flex-col justify-center gap-1">
              <p className="text-[13px] font-medium text-slate-500">All Files:</p>
              <h2 className="text-2xl font-bold text-slate-700">1.234</h2>
            </div>
            <div className="bg-white">
              <Inbox className="size-12 text-blue-500 fill-blue-500" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3 */}
        <Card className="shadow-sm rounded-xl border-slate-200/60 h-32 flex items-center">
          <CardContent className="p-6 flex items-center justify-between w-full h-full">
            <div className="flex flex-col justify-center gap-1">
              <p className="text-[13px] font-medium text-slate-500">Banned Users:</p>
              <h2 className="text-2xl font-bold text-slate-700">8</h2>
            </div>
            <div className="bg-white">
              <TriangleAlert className="size-12 text-red-600 fill-red-600" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4 */}
        <Card className="shadow-sm rounded-xl border-slate-200/60 h-32 flex items-center">
          <CardContent className="p-6 flex items-center justify-between w-full h-full">
            <div className="flex flex-col justify-center gap-1">
              <p className="text-[13px] font-medium text-slate-500">Reports Pending:</p>
              <h2 className="text-2xl font-bold text-slate-700">123</h2>
            </div>
            <div className="bg-white relative">
               <Siren className="size-[42px] text-red-600 fill-red-600 mt-2" />
               <div className="w-8 h-1 bg-slate-600 absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full" />
               <div className="absolute top-0 -left-1 flex space-x-1">
                <span className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                <span className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 5 */}
        <Card className="shadow-sm rounded-xl border-slate-200/60 h-32 flex items-center">
          <CardContent className="p-6 flex items-center justify-between w-full h-full">
            <div className="flex flex-col justify-center gap-1">
              <p className="text-[13px] font-medium text-slate-500">Most Reported User:</p>
              <h2 className="text-xl font-bold text-slate-600 mt-1">SyahbanTzy</h2>
              <p className="text-[11px] text-slate-400">1234 Report</p>
            </div>
          </CardContent>
        </Card>

        {/* Card 6 */}
        <Card 
          className="shadow-sm rounded-xl border-slate-200/60 h-32 flex items-center cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => setActiveModal("reports")}
        >
          <CardContent className="p-6 flex items-center justify-between w-full h-full">
            <div className="flex flex-col justify-center gap-1 w-[40px]">
              <p className="text-sm font-medium text-slate-500 leading-tight">Recent<br/>Reports</p>
            </div>
            <div className="border-[4px] border-amber-400 rounded-full p-2 w-12 h-12 flex items-center justify-center">
              <span className="text-amber-400 font-bold text-xl">!</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 7 */}
        <Card 
          className="shadow-sm rounded-xl border-slate-200/60 h-32 flex items-center cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => setActiveModal("activity")}
        >
          <CardContent className="p-6 flex items-center justify-between w-full h-full">
            <div className="flex flex-col justify-center gap-1 w-[40px]">
              <p className="text-sm font-medium text-slate-500 leading-tight">Recent<br/>Activity</p>
            </div>
            <div className="border-[4px] border-blue-400 border-r-transparent border-b-transparent rotate-45 rounded-full p-0.5 w-12 h-12 flex items-center justify-center relative">
              <History className="size-6 text-blue-400 -rotate-45" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals Overlay */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          {/* Modal Background Click to Close */}
          <div className="absolute inset-0" onClick={() => setActiveModal(null)} />
          
          {/* Modal Content - Recent Reports */}
          {activeModal === "reports" && (
            <div className="relative bg-white rounded-xl shadow-xl w-[480px] p-6 z-10 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="border-[3px] border-amber-400 rounded-full w-8 h-8 flex items-center justify-center">
                  <span className="text-amber-400 font-bold text-sm">!</span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-800">Recent Reports (30)</h2>
              </div>
              
              <div className="flex flex-col gap-4">
                {[
                  { title: "[Video1.Mp4]", reason: "Danger", by: "User123" },
                  { title: "[Video2.Mp4]", reason: "18+", by: "User1234" },
                  { title: "[Video3.Mp4]", reason: "Confidential Info", by: "User12345" },
                ].map((item, idx) => (
                  <div key={idx} className="bg-[#ffe46b] border border-[#ffb13b] rounded-lg p-4 flex items-center justify-between shadow-sm relative">
                    <div className="flex flex-col gap-0.5">
                      <h3 className="font-bold text-red-600 text-[15px]">{item.title}</h3>
                      <p className="text-slate-800 text-[13px] font-medium">Reason: {item.reason}</p>
                      <p className="text-slate-800 text-[13px] font-medium mb-1">Reported By: {item.by}</p>
                      <div className="flex items-center gap-1.5 text-slate-500">
                         <div className="w-2.5 h-2.5 rounded-full border-2 border-slate-400" />
                         <span className="text-[11px] font-medium">Reported 2 Minutes Ago</span>
                      </div>
                    </div>
                    <div>
                      <button className="bg-gradient-to-b from-[#ffed7a] to-[#ffb13b] hover:from-[#ffdc47] hover:to-[#f09a20] border border-[#d68516] text-red-600 font-extrabold text-[15px] px-4 py-2 rounded-md shadow-sm active:scale-95 transition-transform">
                        REVIEW!
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modal Content - Recent Activity */}
          {activeModal === "activity" && (
            <div className="relative bg-white rounded-xl shadow-xl w-[480px] p-6 z-10 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 mb-6">
                 <div className="border-[3px] border-blue-400 border-r-transparent border-b-transparent rotate-45 rounded-full p-0.5 w-8 h-8 flex items-center justify-center relative">
                  <History className="size-4 text-blue-400 -rotate-45" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-800 uppercase tracking-wide">Recent Activity</h2>
              </div>
              
              <div className="flex flex-col gap-3">
                {[
                  { name: "Vio The Goat", action: "Edited", file: "[LABP.Pdf]", time: "2m Ago" },
                  { name: "Vio The Goat", action: "Uploaded", file: "[LABP.Pdf]", time: "1h Ago" },
                  { name: "Farrel", action: "Uploaded", file: "[Image.Png]", time: "2h Ago" },
                  { name: "Gorlock", action: "Uploaded", file: "[Image.Png]", time: "3h Ago" },
                ].map((item, idx) => (
                  <div key={idx} className="bg-[#ccf2f5] border border-[#8fe3e8] rounded-lg p-4 flex justify-between shadow-sm">
                    <div className="flex flex-col gap-1">
                      <h3 className="font-bold text-slate-800 text-[15px]">{item.name}</h3>
                      <p className="text-slate-500 text-[13px]">{item.action}</p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <h3 className="font-bold text-slate-800 text-[15px]">{item.file}</h3>
                      <p className="text-slate-500 text-[13px]">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
