import React from 'react';
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
} from '@/icons/index';

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
};

// Function to get icon component by string name
export const getIconComponent = (iconName: string): React.ReactNode => {
  return iconMap[iconName] || <GridIcon />; // Default fallback icon
};

// Function to add new icons dynamically (for future use)
export const addIconMapping = (iconName: string, iconComponent: React.ReactNode) => {
  iconMap[iconName] = iconComponent;
};

export default iconMap;