import React, { forwardRef } from 'react';
import { DispatchItem } from '../types';
import {
  BarChart3,
  Building2,
  CalendarDays,
  Globe2,
  Headphones,
  MapPin,
  Medal,
  Package,
  Percent,
  Star,
  Target,
  ThumbsUp,
  TrendingDown,
  TrendingUp,
  Truck
} from 'lucide-react';

interface DispatchReportCardProps {
  date: string;
  items: DispatchItem[];
  regionName?: string;
  rmName?: string;
}

export const DispatchReportCard = forwardRef<HTMLDivElement, DispatchReportCardProps>(
  ({ date, items, regionName = 'Regional', rmName }, ref) => {
    const totalTarget = items.reduce((sum, item) => sum + item.target, 0);
    const totalActual = items.reduce((sum, item) => sum + item.dispatch, 0);
    const overallPercentage = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;
    const [year, month, day] = date.split('-');
    const reportSubtitle = 'Regional Dispatch';
    const reportOwner = 'Mr.Priyantha';

    const containerStyle = {
      width: '800px',
      backgroundColor: '#ffffff',
      fontFamily: '"Arial Black", "Inter", ui-sans-serif, system-ui, sans-serif',
      overflow: 'hidden'
    };

    return (
      <div ref={ref} style={containerStyle} className="shadow-2xl text-[#2b0509]">
        {/* Brand Header */}
        <div className="relative h-[172px] overflow-hidden bg-gradient-to-r from-[#7a000b] via-[#960010] to-[#4a0007] px-7 pt-6 text-white">
          <div className="absolute right-20 top-5 text-[#ffd21a] opacity-15">
            <Truck size={180} strokeWidth={1.4} />
          </div>

          <div className="relative z-10">
            <div className="text-[56px] font-black italic leading-[0.95] tracking-[-4px] text-[#ffd21a] drop-shadow">
              -DOMEX-
            </div>
            <div className="mt-3 text-[17px] font-black uppercase tracking-[0.33em] text-white">
              We Deliver Islandwide
            </div>
          </div>

          <div className="absolute right-6 top-5 z-20 w-[226px] rounded-2xl border-2 border-[#ffd21a] bg-[#89000e] px-4 py-3 text-center shadow-xl">
            <div className="mb-2 text-[11px] font-black uppercase tracking-wide text-[#ffd21a]">Report Date</div>
            <div className="flex items-center justify-center gap-3">
              <CalendarDays size={31} className="shrink-0 text-[#ffd21a]" />
              <div className="text-[34px] font-black leading-[0.98] tracking-widest text-white">
                {year || date}
                {month && day ? (
                  <>
                    <br />
                    {month}-{day}
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Title Ribbon */}
        <div className="relative border-b-[5px] border-[#8d0010] bg-gradient-to-r from-[#ffd21a] via-[#ffe27a] to-[#fff3b0] px-5 py-4">
          <div className="flex items-center gap-5">
            <div className="flex h-[70px] w-[112px] items-center justify-center rounded-2xl bg-gradient-to-br from-[#a90013] to-[#590006] text-[#ffd21a] shadow-lg">
              <Truck size={52} strokeWidth={2.6} />
            </div>
            <div>
              <h2 className="text-[45px] font-black uppercase leading-[1] tracking-[0.06em] text-[#8d0010]">
                Dispatch Report
              </h2>
              <div className="mt-2 flex items-center gap-2 text-[15px] font-black uppercase tracking-wide text-[#7a000b]">
                <MapPin size={19} fill="#7a000b" />
                <span>{reportSubtitle}</span>
                <span>•</span>
                <span>{reportOwner}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#f7f7f5] px-5 py-4">
          {/* Summary */}
          <div className="mb-4 grid grid-cols-4 items-center rounded-2xl bg-gradient-to-r from-[#8b000e] via-[#520006] to-[#82000d] px-5 py-4 text-white shadow-lg">
            <div className="flex min-w-0 items-center gap-3 border-r border-[#ffd21a]/55 pr-4">
              <Target size={40} className="shrink-0 text-[#ffd21a]" />
              <div>
                <div className="text-[12px] font-black uppercase tracking-wide">Total Target</div>
                <div className="text-[36px] font-black leading-[1.05] text-[#ffd21a]">{totalTarget.toLocaleString()}</div>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-3 border-r border-[#ffd21a]/55 px-4">
              <Package size={38} className="shrink-0 text-[#ffd21a]" />
              <div>
                <div className="text-[12px] font-black uppercase tracking-wide">Total Actual</div>
                <div className="text-[36px] font-black leading-[1.05]">{totalActual.toLocaleString()}</div>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-3 border-r border-[#ffd21a]/55 px-4">
              <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full border-[5px] border-[#4dde55]">
                <Percent size={26} className="text-white" />
              </div>
              <div>
                <div className="text-[12px] font-black uppercase tracking-wide">Overall %</div>
                <div className="text-[36px] font-black leading-[1.05] text-[#58f05b]">{overallPercentage}%</div>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-3 pl-4">
              <TrendingUp size={38} className="shrink-0 text-[#ffd21a]" />
              <div>
                <div className="text-[12px] font-black uppercase tracking-wide">Branches</div>
                <div className="text-[36px] font-black leading-[1.05]">{items.length}</div>
              </div>
            </div>
          </div>

          {/* Table */}
          <table className="w-full table-fixed overflow-hidden rounded-xl border-separate border-spacing-0 bg-white shadow-lg">
            <thead>
              <tr className="bg-gradient-to-r from-[#8b000e] to-[#550006] text-[14px] font-black uppercase tracking-wide text-white">
                <th className="w-[64px] border-r border-[#ffd21a]/70 p-2.5 text-center"></th>
                <th className="border-r border-[#ffd21a]/70 p-2.5 text-left">
                  <div className="flex items-center gap-2.5">
                    <Building2 size={22} className="shrink-0 text-[#ffd21a]" /> Branch
                  </div>
                </th>
                <th className="w-[112px] border-r border-[#ffd21a]/70 p-2.5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Target size={20} className="shrink-0 text-[#ffd21a]" /> Target
                  </div>
                </th>
                <th className="w-[112px] border-r border-[#ffd21a]/70 p-2.5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Package size={20} className="shrink-0" /> Actual
                  </div>
                </th>
                <th className="w-[108px] border-r border-[#ffd21a]/70 p-2.5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Percent size={20} className="shrink-0" /> %
                  </div>
                </th>
                <th className="w-[134px] p-2.5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Medal size={21} className="shrink-0 text-[#ffd21a]" /> Status
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const isExcellent = item.percentage >= 100;
                const isGood = item.percentage >= 70 && item.percentage < 100;
                const percentageColor = isExcellent ? 'text-[#248a35]' : isGood ? 'text-[#f27507]' : 'text-[#d92920]';
                const statusBadge = isExcellent
                  ? 'bg-gradient-to-r from-[#32a849] to-[#2d923f] text-white'
                  : isGood
                    ? 'bg-gradient-to-r from-[#ffda45] to-[#ffc838] text-[#8b1b00]'
                    : 'bg-gradient-to-r from-[#ffb7bc] to-[#ff9ea6] text-[#b11219]';

                return (
                  <tr key={idx} className="bg-white">
                    <td className="h-[70px] align-middle border-b border-r border-[#e8e1df] p-2">
                      <div className="flex h-[46px] items-center justify-center rounded-lg border-l-4 border-[#ffd21a] bg-gradient-to-br from-[#9b0010] to-[#590006] text-[24px] font-black tracking-wider text-white">
                        {String(idx + 1).padStart(2, '0')}
                      </div>
                    </td>
                    <td className="h-[70px] align-middle border-b border-r border-[#e8e1df] px-3 text-[20px] font-black uppercase leading-[1.2] tracking-tight text-[#4f070b]">
                      <div className="flex h-full max-w-full items-center overflow-hidden text-ellipsis whitespace-nowrap" title={item.branch}>
                        {item.branch}
                      </div>
                    </td>
                    <td className="h-[70px] align-middle border-b border-r border-[#e8e1df] text-center text-[34px] font-black leading-[1.2] text-[#8d0010]">
                      {item.target.toLocaleString()}
                    </td>
                    <td className="h-[70px] align-middle border-b border-r border-[#e8e1df] text-center text-[34px] font-black leading-[1.2] text-[#222]">
                      {item.dispatch.toLocaleString()}
                    </td>
                    <td className={`h-[70px] align-middle border-b border-r border-[#e8e1df] px-1 text-center text-[29px] font-black leading-[1.2] ${percentageColor}`}>
                      <div className="flex h-full max-w-full items-center justify-center overflow-hidden whitespace-nowrap">
                        {Math.round(item.percentage)}%
                      </div>
                    </td>
                    <td className="h-[70px] align-middle border-b border-[#e8e1df] px-3 text-center">
                      <span className={`inline-flex min-w-[100px] items-center justify-center gap-1.5 rounded-full px-2 py-2 text-[12px] font-black uppercase leading-[1.2] shadow ${statusBadge}`}>
                        {isExcellent ? <Star size={18} fill="white" /> : isGood ? <ThumbsUp size={18} fill="currentColor" /> : <TrendingDown size={18} />}
                        {isExcellent ? 'Excellent' : isGood ? 'Good' : 'Poor'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-[#7a000b] via-[#9b0010] to-[#4a0007] px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ffd21a] text-[#7a000b]">
                <Headphones size={31} />
              </div>
              <div>
                <div className="text-[14px] font-black uppercase tracking-wide text-[#ffd21a]">Domex Operations System</div>
                <div className="text-[12px]">Performance • Precision • Progress</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[#ffd21a]">
              <Globe2 size={40} />
              <div className="text-[18px] font-black uppercase leading-tight text-[#ffd21a]">
                We Deliver
                <br />
                Islandwide
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BarChart3 size={39} className="text-[#ffd21a]" />
              <div>
                <div className="text-[14px] font-black uppercase tracking-wide text-[#ffd21a]">Generated Automatically</div>
                <div className="text-[12px]">Thank you for powering progress</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

DispatchReportCard.displayName = 'DispatchReportCard';
