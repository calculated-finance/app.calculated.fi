import { ComponentWithAs, IconProps } from '@chakra-ui/react';
import { Add1Icon, BoxedImportIcon, HomeIcon, KnowledgeIcon, ToolkitIcon } from '@fusion-icons/react/interface';
import { ChainId } from '@models/ChainId';
import { SVGProps } from 'react';
import { RETIRED_CHAINS } from 'src/constants';
import { Pages } from '../pages/Pages';

export interface LinkItem {
  name: string;
  child?: JSX.Element;
  icon: ((props: SVGProps<SVGSVGElement>) => JSX.Element) | ComponentWithAs<'svg', IconProps>;
  active?: boolean;
  href: Pages;
  exclude?: ChainId[];
}

export const LinkItems: Array<LinkItem> = [
  { name: 'Home', icon: HomeIcon, href: Pages.Home },
  { name: 'Create strategy', icon: Add1Icon, href: Pages.CreateStrategy, exclude: RETIRED_CHAINS },
  { name: 'My strategies', icon: ToolkitIcon, href: Pages.Strategies },
  { name: 'Bridge assets', icon: BoxedImportIcon, href: Pages.GetAssets },
  { name: 'Learning hub', icon: KnowledgeIcon, href: Pages.LearnAboutCalc },
];
