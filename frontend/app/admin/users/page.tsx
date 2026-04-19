"use client"

import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Mock Data
const ACTIVE_USERS = [
  { id: 1, name: "Scarlett Johansson", email: "scarlettjohansson@gmail.com", login: "17/06/2023", status: "ABNORMAL", reports: 3, files: 25 },
  { id: 2, name: "Leonardo DiCaprio", email: "leonardodicaprio@gmail.com", login: "24/11/2023", status: "NORMAL", reports: 0, files: 33 },
  { id: 3, name: "Patrick Bateman", email: "patrickbateman@gmail.com", login: "28/03/2019", status: "NORMAL", reports: 0, files: 10 },
  { id: 4, name: "Tobey Maguire", email: "tobeymaguire@gmail.com", login: "22/01/2021", status: "ABNORMAL", reports: 1, files: 15 },
  { id: 5, name: "Scarlett Johansson", email: "scarlettjohansson@gmail.com", login: "17/06/2023", status: "ABNORMAL", reports: 3, files: 25 },
  { id: 6, name: "Leonardo DiCaprio", email: "leonardodicaprio@gmail.com", login: "24/11/2023", status: "NORMAL", reports: 0, files: 33 },
  { id: 7, name: "Patrick Bateman", email: "patrickbateman@gmail.com", login: "28/03/2019", status: "NORMAL", reports: 0, files: 10 },
  { id: 8, name: "Tobey Maguire", email: "tobeymaguire@gmail.com", login: "22/01/2021", status: "ABNORMAL", reports: 1, files: 15 },
  { id: 9, name: "Scarlett Johansson", email: "scarlettjohansson@gmail.com", login: "17/06/2023", status: "ABNORMAL", reports: 3, files: 25 },
  { id: 10, name: "Leonardo DiCaprio", email: "leonardodicaprio@gmail.com", login: "24/11/2023", status: "NORMAL", reports: 0, files: 33 },
  { id: 11, name: "Patrick Bateman", email: "patrickbateman@gmail.com", login: "28/03/2019", status: "NORMAL", reports: 0, files: 10 },
  { id: 12, name: "Tobey Maguire", email: "tobeymaguire@gmail.com", login: "22/01/2021", status: "ABNORMAL", reports: 1, files: 15 },
  { id: 13, name: "Scarlett Johansson", email: "scarlettjohansson@gmail.com", login: "17/06/2023", status: "ABNORMAL", reports: 3, files: 25 },
  { id: 14, name: "Leonardo DiCaprio", email: "leonardodicaprio@gmail.com", login: "24/11/2023", status: "NORMAL", reports: 0, files: 33 },
  { id: 15, name: "Patrick Bateman", email: "patrickbateman@gmail.com", login: "28/03/2019", status: "NORMAL", reports: 0, files: 10 },
  { id: 16, name: "Tobey Maguire", email: "tobeymaguire@gmail.com", login: "22/01/2021", status: "ABNORMAL", reports: 1, files: 15 },
]

const BANNED_USERS = Array(8).fill(null).map((_, i) => ({
  id: i + 1,
  name: "Scarlett Johansson",
  email: "scarlettjohansson@gmail.com",
  status: "BANNED",
  bannedAt: "17/06/2020",
  reports: 10,
  files: 25
}))

function getStatusBadge(user: typeof ACTIVE_USERS[0]) {
  if (user.status === "NORMAL") return <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-sm text-[10px] font-bold tracking-wide uppercase">Normal</span>
  if (user.reports > 1) return <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-sm text-[10px] font-bold tracking-wide uppercase">Abnormal</span>
  return <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-sm text-[10px] font-bold tracking-wide uppercase">Warning</span>
}

export default function UsersPage() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-normal text-slate-800">Users</h1>
        <p className="text-[13px] text-blue-400">Users</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* Left Side: USER ACTIVE */}
        <div className="flex-1 w-full bg-white rounded-lg shadow-sm overflow-hidden p-6 pt-4 border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-500 text-white text-[11px] font-bold px-4 py-1.5 rounded-sm tracking-wide shadow-sm">
              USER ACTIVE
            </div>
            <Input 
              placeholder="Search User..." 
              className="w-48 h-8 text-xs rounded-sm border-slate-200"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-[10px] md:text-xs text-slate-600 font-medium border-collapse">
              <thead>
                <tr className="border-b border-slate-200 uppercase text-slate-500 bg-slate-50/50">
                  <th className="py-3 px-2 font-bold w-10">No</th>
                  <th className="py-3 px-2 font-bold text-left">Name</th>
                  <th className="py-3 px-2 font-bold text-left">E-Mail</th>
                  <th className="py-3 px-2 font-bold">Last Login</th>
                  <th className="py-3 px-2 font-bold">Status</th>
                  <th className="py-3 px-2 font-bold">Reports</th>
                  <th className="py-3 px-2 font-bold">Files</th>
                  <th className="py-3 px-2 font-bold w-12">Action</th>
                </tr>
              </thead>
              <tbody className="border-x border-b border-slate-100">
                {ACTIVE_USERS.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors bg-white">
                    <td className="py-2.5 px-2 text-slate-400">{user.id}</td>
                    <td className="py-2.5 px-2 text-left">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-7 border border-slate-200">
                          <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.name}`} />
                          <AvatarFallback className="text-[9px]">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-[12px] truncate w-24 sm:w-32 font-semibold text-slate-700">
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-left text-[11px] text-slate-500">{user.email}</td>
                    <td className="py-2.5 px-2 text-[11px] text-slate-500">{user.login}</td>
                    <td className="py-2.5 px-2">{getStatusBadge(user)}</td>
                    <td className="py-2.5 px-2 text-[11px] font-bold text-slate-600">{user.reports > 0 ? <span className={user.reports > 1 ? "text-rose-500" : "text-amber-500"}>{user.reports}</span> : <span className="text-slate-400">{user.reports}</span>}</td>
                    <td className="py-2.5 px-2 text-[11px] text-slate-500">{user.files}</td>
                    <td className="py-2.5 px-2 flex justify-center">
                       <button className="bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm transition-all focus:ring-2 ring-rose-100 outline-none my-1">
                        Ban
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: BANNED USER */}
        <div className="flex-1 w-full xl:max-w-[45%] bg-white rounded-lg shadow-sm overflow-hidden p-6 pt-4 border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-rose-500 text-white text-[11px] font-bold px-4 py-1.5 rounded-sm tracking-wide shadow-sm">
              BANNED USER
            </div>
            <Input 
              placeholder="Search User..." 
              className="w-48 h-8 text-xs rounded-sm border-slate-200 focus-visible:ring-rose-200"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-[10px] md:text-xs text-slate-600 font-medium border-collapse">
              <thead>
                <tr className="border-b border-slate-200 uppercase text-slate-500 bg-slate-50/50">
                  <th className="py-3 px-2 font-bold w-8">No</th>
                  <th className="py-3 px-2 font-bold text-left">Name</th>
                  <th className="py-3 px-2 font-bold text-left">E-Mail</th>
                  <th className="py-3 px-2 font-bold">Status</th>
                  <th className="py-3 px-2 font-bold">Reports</th>
                  <th className="py-3 px-2 font-bold w-12">Action</th>
                </tr>
              </thead>
              <tbody className="border-x border-b border-slate-100">
                {BANNED_USERS.map((user) => (
                  <tr key={`banned-${user.id}`} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors bg-white">
                    <td className="py-2.5 px-2 text-slate-400">{user.id}</td>
                    <td className="py-2.5 px-2 text-left">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-7 border border-slate-200">
                          <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.name}`} />
                          <AvatarFallback className="text-[9px]">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-[12px] truncate w-24 sm:w-28 font-semibold text-slate-700">
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-[11px] text-slate-500">{user.email}</td>
                    <td className="py-2.5 px-2">
                       <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-sm text-[10px] font-bold tracking-wide uppercase">Banned</span>
                    </td>
                    <td className="py-2.5 px-2 text-[11px] font-bold text-rose-600">{user.reports}</td>
                    <td className="py-2.5 px-2 flex justify-center">
                       <button className="bg-white hover:bg-emerald-50 text-emerald-600 border border-slate-200 hover:border-emerald-200 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm transition-all focus:ring-2 ring-emerald-100 outline-none my-1 whitespace-nowrap">
                        Unban
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
