import clock from "../assets/svgs/clock.svg";
import microPhone from "../assets/svgs/microPhone.svg";
import AI from "../assets/AI.png";
import simbliLogo from "../assets/svgs/simbliLogo.svg";
import { ClockIcon, MegaphoneIcon, Pencil, Trash2 } from "lucide-react";
const ContentHistoryNew = () => {
  return (
    <div className="p-6 rounded-lg shadow-md">
      <div className="flex flex-wrap bg-[#FFFFFF] shadow-md p-3 rounded-lg justify-between items-center mb-4">
        <div className="flex items-start justify-start gap-2">
          <div className="bg-[#EFFBEF] rounded-full p-2 flex justify-center items-center">
            <img src={clock} className="w-6" />
          </div>
          <div className="flex flex-col">
            <h5 className=" content-history text-md text-[#022C33] font-inter font-bold">
              Content History
            </h5>
            <p className="font-inter text-[#515151] text-xs">
              Manage and track all your generated content
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm bg-[#D9F0F4] px-3 py-2 rounded-md">
          <img src={microPhone} loading="lazy" className="w-4" />
          <span className="font-medium font-inter text-base text-[#005361]">
            Total Posts
          </span>

          <div className="h-6 w-px bg-[#005b63]/40"></div>
          <span className="font-medium font-inter text-[#005361] text-base">
            13
          </span>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        {/* First Select */}
        <div className="relative inline-block">
          <select className="appearance-none sel-plat focus:outline-none bg-[#FFFFFF] rounded-md py-2 pl-4 pr-8 text-sm text-[#515151]">
            <option>All Time</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#515151]">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </span>
        </div>

        {/* Second Select */}
        <div className="relative inline-block ml-3">
          <select className="appearance-none sel-plat focus:outline-none bg-[#FFFFFF] rounded-md py-2 pl-4 pr-11 text-sm text-[#515151]">
            <option>All Platforms</option>
            <option>LinkedIn</option>
            <option>X</option>
            <option>Instagram</option>
            <option>Facebook</option>
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#515151]">
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </span>
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex justify-between items-center">
          <div className="flex items-start justify-start gap-2">
            <div className=" text-white w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold">
              <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 40C31.0457 40 40 31.0457 40 20C40 8.95431 31.0457 0 20 0C8.95431 0 0 8.95431 0 20C0 31.0457 8.95431 40 20 40Z"
                  fill="#0B69C7"
                />
                <path
                  d="M15.5263 12.7289C15.5268 13.2694 15.367 13.7979 15.0671 14.2475C14.7671 14.6971 14.3405 15.0477 13.8413 15.2547C13.3421 15.4618 12.7926 15.5161 12.2625 15.4108C11.7324 15.3055 11.2454 15.0453 10.8632 14.6631C10.481 14.2809 10.2208 13.794 10.1155 13.2638C10.0102 12.7337 10.0645 12.1843 10.2716 11.685C10.4787 11.1858 10.8292 10.7592 11.2788 10.4593C11.7284 10.1593 12.2569 9.99948 12.7974 10C13.5209 10.0007 14.2146 10.2884 14.7263 10.8001C15.2379 11.3117 15.5256 12.0054 15.5263 12.7289Z"
                  fill="white"
                />
                <path
                  d="M14.2342 16.5977H11.3605C10.987 16.5977 10.6842 16.9005 10.6842 17.274V29.324C10.6842 29.6975 10.987 30.0003 11.3605 30.0003H14.2342C14.6077 30.0003 14.9105 29.6975 14.9105 29.324V17.274C14.9105 16.9005 14.6077 16.5977 14.2342 16.5977Z"
                  fill="white"
                />
                <path
                  d="M29.9342 23.5446V29.3789C29.9342 29.5436 29.8688 29.7015 29.7523 29.818C29.6358 29.9345 29.4779 29.9999 29.3131 29.9999H26.2289C26.0642 29.9999 25.9063 29.9345 25.7898 29.818C25.6733 29.7015 25.6079 29.5436 25.6079 29.3789V23.7262C25.6079 22.8815 25.8526 20.042 23.4026 20.042C21.5026 20.042 21.1158 21.9946 21.0342 22.871V29.392C21.0308 29.5535 20.9646 29.7074 20.8496 29.8208C20.7346 29.9343 20.58 29.9986 20.4184 29.9999H17.4342C17.3525 30.0003 17.2716 29.9844 17.1961 29.9533C17.1206 29.9223 17.052 29.8765 16.9943 29.8188C16.9365 29.761 16.8908 29.6924 16.8597 29.6169C16.8286 29.5414 16.8128 29.4605 16.8131 29.3789V17.221C16.8128 17.1392 16.8286 17.0581 16.8597 16.9825C16.8907 16.9068 16.9364 16.8381 16.9941 16.7801C17.0518 16.7222 17.1204 16.6762 17.1959 16.6448C17.2714 16.6134 17.3524 16.5973 17.4342 16.5973H20.4184C20.5012 16.5959 20.5834 16.611 20.6603 16.6417C20.7372 16.6724 20.8072 16.7181 20.8662 16.7762C20.9253 16.8342 20.9722 16.9035 21.0042 16.9798C21.0362 17.0562 21.0526 17.1382 21.0526 17.221V18.2736C21.7579 17.221 22.8053 16.3999 25.0342 16.3999C29.9631 16.3973 29.9342 21.0104 29.9342 23.5446Z"
                  fill="white"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-md  text-[#0B69C7] mb-0">
                LinkedIn
                <span className="bg-[#EFFFEB] border-[0.5px] border-[#29AA6A] text-[#29AA6A] text-xs px-2 py-0.5 rounded-full ml-2">
                  TECH
                </span>
              </p>
              <div className="flex items-center  gap-1">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 17 15"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M16 8.58333L14.4775 7.13889L12.9543 8.58333M14.7056 7.5C14.7056 11.0899 11.6375 14 7.85279 14C4.0681 14 1 11.0899 1 7.5C1 3.91015 4.0681 1 7.85279 1C10.3669 1 12.5648 2.28421 13.7572 4.19879M7.85279 3.88889V7.5L10.1371 8.94444"
                    stroke="#515151"
                    stroke-width="1.2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <p className="text-xs text-gray-500 mb-0 pb-0">
                  10 Sept 2025, 05:56 pm
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 text-gray-500">
            <button className="flex items-center gap-1 text-[#012C33] hover:underline pen-edit justify-center">
              <Pencil className="w-4 h-4" /> Edit
            </button>
            <button className="flex items-center gap-1 text-[#E3374D] hover:underline pen-edit justify-center ">
              <svg
                width="15"
                height="15"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7 1H13M1 4H19M17 4L16.2987 14.5193C16.1935 16.0975 16.1409 16.8867 15.8 17.485C15.4999 18.0118 15.0472 18.4353 14.5017 18.6997C13.882 19 13.0911 19 11.5093 19H8.4907C6.90891 19 6.11803 19 5.49834 18.6997C4.95276 18.4353 4.50009 18.0118 4.19998 17.485C3.85911 16.8867 3.8065 16.0975 3.70129 14.5193L3 4M8 8.5V13.5M12 8.5V13.5"
                  stroke="#E3374D"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              Delete
            </button>
          </div>
        </div>

        <div className="bg-[#EFFBEF] border border-green-200 rounded-md p-3 my-4 text-sm text-gray-700">
          <div className="flex gap-2 text-[#1F1F1F]">
            <img src={simbliLogo} loading="lazy" />
            <span className="font-semibold text-[#1F1F1F]">Prompt: </span>
          </div>
          “Lorem Ipsum is simply dummy text of the printing and typesetting
          industry.”
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 text-sm text-gray-800 space-y-3">
            <div className="bg-[#F5F5F5] p-3">
              <p>
                🚀 Are we ready for the AI revolution? The future is here, and
                it's colorful, dynamic, and filled with endless possibilities!
                🌈
              </p>
              <p>
                Let’s take a moment to imagine our lives in a world where AI
                powers our everyday decisions. From personalized learning
                experiences to smart home technologies, AI is weaving itself
                into the very fabric of our daily lives. Just the other day, I
                was chatting with a friend about how AI could change the job
                landscape. It’s thrilling and a little daunting, right?
              </p>
              <p>
                But here’s the kicker: AI isn’t just about automation; it’s
                about enhancement! Think about it - we can leverage AI to
                amplify our creativity, streamline our workflows, and even help
                us make more informed choices. I recently used an AI tool to
                brainstorm ideas for a project, and it sparked a whole new wave
                of inspiration! 🎉 What tools have you tried that made a
                difference in your work?
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                "#AI",
                "#Technology",
                "#Innovation",
                "#FutureOfWork",
                "#DigitalTransformation",
              ].map((tag) => (
                <span
                  key={tag}
                  className="bg-[#EBF3FF]  text-xs border border-[#75BBF4] text-[#1A75BF]  px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="w-full md:w-72">
            <img src={AI} alt="AI Robot" className=" object-cover w-full " />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentHistoryNew;
