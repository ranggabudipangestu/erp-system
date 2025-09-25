import React from "react";
import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
  DocsIcon,
  GroupIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BoltIcon,
  DollarLineIcon,
  BoxIcon,
  LockIcon,
  TimeIcon,
  TaskIcon,
} from "@/icons/index";
import {
  BarChart,
  BarChart2Icon,
  BarChart3Icon,
  BarChart4Icon,
  BarChartIcon,
  BookIcon,
  BookOpenIcon,
  BoxesIcon,
  CalendarClockIcon,
  ChartAreaIcon,
  ChartLineIcon,
  ClipboardListIcon,
  CoinsIcon,
  DatabaseIcon,
  DollarSignIcon,
  FactoryIcon,
  FileCheckIcon,
  FileInputIcon,
  FilePlusIcon,
  FileQuestionIcon,
  FileTextIcon,
  IdCardIcon,
  LayersIcon,
  ListChecksIcon,
  LogInIcon,
  LogOutIcon,
  MapPin,
  PackageIcon,
  PackagePlus,
  PercentIcon,
  ReceiptIcon,
  RepeatIcon,
  RotateCcwIcon,
  RotateCwIcon,
  Ruler,
  ScaleIcon,
  ServerCog,
  ShieldIcon,
  ShoppingBagIcon,
  ShoppingCart,
  ShuffleIcon,
  SlidersIcon,
  TagIcon,
  TagsIcon,
  TimerIcon,
  TimerResetIcon,
  TouchpadIcon,
  TrendingUpIcon,
  Users2Icon,
  UsersIcon,
  WalletCardsIcon,
  WalletIcon,
  WavesIcon,
  WrenchIcon,
} from "lucide-react";

// Icon mapping object
const iconMap: Record<string, React.ReactNode> = {
  BoxCubeIcon: <BoxCubeIcon />,
  CalenderIcon: <CalenderIcon />,
  ChevronDownIcon: <ChevronDownIcon />,
  GridIcon: <GridIcon />,
  HorizontaLDots: <HorizontaLDots />,
  ListIcon: <ListIcon />,
  PageIcon: <PageIcon />,
  PieChartIcon: <PieChartIcon />,
  PlugInIcon: <PlugInIcon />,
  TableIcon: <TableIcon />,
  UserCircleIcon: <UserCircleIcon />,
  DocsIcon: <DocsIcon />,
  GroupIcon: <GroupIcon />,
  ArrowRightIcon: <ArrowRightIcon />,
  ArrowUpIcon: <ArrowUpIcon />,
  ArrowDownIcon: <ArrowDownIcon />,
  BoltIcon: <BoltIcon />,
  DollarLineIcon: <DollarLineIcon />,
  BoxIcon: <BoxIcon />,
  LockIcon: <LockIcon />,
  TimeIcon: <TimeIcon />,
  TaskIcon: <TaskIcon />,
};

const aliasMap: Record<string, React.ReactNode> = {
  database: <DatabaseIcon />,
  boxes: <BoxesIcon />,
  "box-cube": <BoxCubeIcon />,
  "shopping-cart": <ShoppingCart />,
  "trending-up": <TrendingUpIcon />,
  shield: <ShieldIcon />,
  box: <BoxIcon />,
  package: <PackageIcon />,
  "package-plus": <PackagePlus />,
  "shopping-bag": <ShoppingBagIcon />,
  "file-text": <FileTextIcon />,
  "file-plus": <FilePlusIcon />,
  "file-input": <FileInputIcon />,
  "file-check": <FileCheckIcon />,
  receipt: <ReceiptIcon />,
  book: <BookIcon />,
  "book-open": <BookOpenIcon />,
  "calendar-clock": <CalendarClockIcon />,
  tags: <TagsIcon />,
  list: <ListIcon />,
  "list-checks": <ListChecksIcon />,
  "clipboard-list": <ClipboardListIcon />,
  users: <UsersIcon />,
  "users-2": <Users2Icon />,
  "user-circle": <UserCircleIcon />,
  "id-card": <IdCardIcon />,
  "bar-chart": <BarChartIcon />,
  "bar-chart-2": <BarChart2Icon />,
  "bar-chart-3": <BarChart3Icon />,
  "chart-line": <ChartLineIcon />,
  percent: <PercentIcon />,
  coins: <CoinsIcon />,
  wallet: <WalletIcon />,
  "wallet-cards": <WalletCardsIcon />,
  "log-in": <LogInIcon />,
  "log-out": <LogOutIcon />,
  repeat: <RepeatIcon />,
  "rotate-ccw": <RotateCcwIcon />,
  "rotate-cw": <RotateCwIcon />,
  "map-pin": <MapPin />,
  ruler: <Ruler />,
  table: <TableIcon />,
  factory: <FactoryIcon />,
  layers: <LayersIcon />,
  "server-cog": <ServerCog />,
  shuffle: <ShuffleIcon />,
  sliders: <SlidersIcon />,
  timer: <TimerIcon />,
  "timer-reset": <TimerResetIcon />,
  waves: <WavesIcon />,
  touchpad: <TouchpadIcon />,
  wrench: <WrenchIcon />,
  "file-question": <FileQuestionIcon />,
  scale: <ScaleIcon />,
  "bar-chart-4": <BarChart4Icon />,
  "dollar-sign": <DollarSignIcon />,
  "pie-chart": <PieChartIcon />,
  grid: <GridIcon />,
};

const sanitizeIconName = (iconName: string): string => {
  if (!iconName) return "";

  const trimmed = iconName.trim();
  if (!trimmed) return "";

  const prefixPattern =
    /^(?:lucide|icon|icons|mdi|heroicons?|heroicon|ph|bi|fa)[-:_.\s]*/i;
  let withoutPrefix = trimmed;
  while (prefixPattern.test(withoutPrefix)) {
    withoutPrefix = withoutPrefix.replace(prefixPattern, "");
  }

  const camelToKebab = withoutPrefix.replace(/([a-z\d])([A-Z])/g, "$1-$2");
  const normalized = camelToKebab
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return normalized;
};

// Function to get icon component by string name
export const getIconComponent = (iconName?: string | null): React.ReactNode => {
  if (!iconName) {
    return <HorizontaLDots />;
  }

  if (iconMap[iconName]) {
    return iconMap[iconName];
  }

  if (iconMap[iconName]) {
    return iconMap[iconName];
  }

  if (aliasMap[iconName]) {
    return aliasMap[iconName];
  }

  const withoutIconSuffix = iconName.replace(/-icon$/, "");
  if (withoutIconSuffix !== iconName) {
    if (iconMap[withoutIconSuffix]) {
      return iconMap[withoutIconSuffix];
    }
    if (aliasMap[withoutIconSuffix]) {
      return aliasMap[withoutIconSuffix];
    }
  }

  return <HorizontaLDots />;
};

// Function to add new icons dynamically (for future use)
export const addIconMapping = (
  iconName: string,
  iconComponent: React.ReactNode
) => {
  iconMap[iconName] = iconComponent;
};

export default iconMap;
