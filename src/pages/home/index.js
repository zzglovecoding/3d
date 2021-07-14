import { dynamic } from '@/utils';

const IndexLayout = dynamic(import('@/layout/index-layout'));
const HomePage = dynamic(import('./home-page'));
const HomeChildPage = dynamic(import('./home-child-page'));

const pages = { IndexLayout, HomePage, HomeChildPage };

const routes = [
    {
        path: '',
        component: pages.IndexLayout,
        meta: { auth: true },
        routes: [
            { path: 'child', exact: true, component: pages.HomeChildPage },
            { path: '', exact: true, component: pages.HomePage }
        ]
    }
];

export { pages, routes };
