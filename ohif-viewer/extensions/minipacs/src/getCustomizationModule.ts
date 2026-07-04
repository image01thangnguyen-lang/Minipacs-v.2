import { codingValues, contextMenuCodeItem, findingsContextMenu } from './custom-context-menu';
import { 
  MinipacsStudyLineOverlayItem, 
  MinipacsSeriesLineOverlayItem, 
  MinipacsSeriesIndexOverlayItem, 
  MinipacsMiniToolbarOverlayItem,
  MinipacsCineHudOverlayItem,
  MinipacsAdvancedHudOverlayItem
} from './Components/MiniPacsOverlayItems';

export default function getCustomizationModule() {
  return [
    {
      name: 'custom-context-menu',
      value: [codingValues, contextMenuCodeItem, findingsContextMenu],
    },
    {
      name: 'minipacs.overlayItem.studyLine',
      value: {
        id: 'minipacs.overlayItem.studyLine',
        content: MinipacsStudyLineOverlayItem,
      },
    },
    {
      name: 'minipacs.overlayItem.seriesLine',
      value: {
        id: 'minipacs.overlayItem.seriesLine',
        content: MinipacsSeriesLineOverlayItem,
      },
    },
    {
      name: 'minipacs.overlayItem.seriesIndex',
      value: {
        id: 'minipacs.overlayItem.seriesIndex',
        content: MinipacsSeriesIndexOverlayItem,
      },
    },
    {
      name: 'minipacs.overlayItem.miniToolbar',
      value: {
        id: 'minipacs.overlayItem.miniToolbar',
        content: MinipacsMiniToolbarOverlayItem,
      },
    },
    {
      name: 'minipacs.overlayItem.cineHud',
      value: {
        id: 'minipacs.overlayItem.cineHud',
        content: MinipacsCineHudOverlayItem,
      },
    },
    {
      name: 'minipacs.overlayItem.advancedHud',
      value: {
        id: 'minipacs.overlayItem.advancedHud',
        content: MinipacsAdvancedHudOverlayItem,
      },
    },
  ];
}
