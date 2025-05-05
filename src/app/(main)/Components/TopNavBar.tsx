// "use client";
// import { usePathname } from "next/navigation";
import ThemeSwitch from "./ThemeSwitch";
import LoginLogoutButton from "@/components/serverSide/loginLogoutButton";

export default async function TopHeader() {

  // const pathname = usePathname();

  // const getPageTitle = () => {
  //   switch (pathname) {
  //     case "/":
  //       return "Dashboard";
  //     case "/stocks":
  //       return "Stocks";
  //     case "/analysis":
  //       return "Analysis";
  //     case "/news":
  //       return "News";
  //     case "/settings":
  //       return "Settings";
  //     default:
  //       return "Dashboard";
  //   }
  // };

  return (
    // <header className="bg-slate-50 dark:bg-gray-950 shadow-sm sticky top-0 z-10">
    //   <div className="flex items-center justify-between px-8 py-4">
    //     <div className="flex items-center">
    //       <h2 className="text-xl font-semibold text-blue-900 dark:text-white">
    //         {getPageTitle()}
    //       </h2>
    //     </div>
    //     <div className="flex items-center space-x-4">
    //       <ThemeSwitch></ThemeSwitch>
    //       <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400">
    //         <FaBell className="h-5 w-5" />
    //       </button>
    //       <LoginLogoutButton />
    //     </div>
    //   </div>
    // </header>
    <header className="bg-slate-50 dark:bg-gray-950 shadow-sm sticky top-0 z-10">
  <div className="flex items-center justify-end px-8 py-4">
    <div className="flex items-center space-x-4">
      <ThemeSwitch />
      {/* <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400">
        <FaBell className="h-5 w-5" />
      </button> */}
      <LoginLogoutButton />
    </div>
  </div>
</header>

  );
}
