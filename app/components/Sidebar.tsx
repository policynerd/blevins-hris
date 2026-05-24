import { NavLink } from "@remix-run/react";
import React from "react";

import Logo from "~/components/Logo";
import ArrowRightIcon from "./icons/ArrowRight";
import CloseIcon from "./icons/Close";

const NAV_SECTIONS = [
  {
    label: "People",
    items: [
      { label: "Employees", href: "/dashboard/employees" },
      { label: "Departments", href: "/dashboard/departments" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "User Profile", href: "/dashboard/user" },
    ],
  },
];

type Props = {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function Sidebar({ isOpen, setIsOpen }: Props) {
  return (
    <aside
      className={`fixed top-0 left-0 z-20 flex h-full p-2 w-2xs transition-transform ${
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
    >
      <div className="flex flex-col gap-6 p-4 bg-white rounded-lg shadow-md grow overflow-hidden">
        <div className="flex items-center justify-between gap-4">
          <Logo />
          <button
            className="flex items-center justify-center w-8 h-8 transition rounded-md cursor-pointer md:hidden text-slate-900 hover:bg-slate-100"
            onClick={() => setIsOpen(false)}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="overflow-y-auto hide-scrollbar flex flex-col gap-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {section.label}
              </p>
              <ul className="border-t border-slate-200">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        isActive
                          ? "flex items-center justify-between px-2 py-4 border-b border-cyan-300 font-medium"
                          : "flex items-center justify-between px-2 py-4 border-b border-slate-200 group hover:border-cyan-300"
                      }
                      end={item.href === "/dashboard"}
                    >
                      {({ isActive }) => (
                        <>
                          <span className="text-sm">{item.label}</span>
                          <span
                            className={
                              isActive
                                ? "text-cyan-300"
                                : "text-slate-300 group-hover:text-cyan-300"
                            }
                          >
                            <ArrowRightIcon />
                          </span>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
