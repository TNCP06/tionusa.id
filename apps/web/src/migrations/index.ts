import * as migration_20260703_092811_initial from './20260703_092811_initial';
import * as migration_20260703_202158_blog_phase2_articles from './20260703_202158_blog_phase2_articles';
import * as migration_20260703_214240_add_article_published_at from './20260703_214240_add_article_published_at';
import * as migration_20260704_171630_portfolio_external_id from './20260704_171630_portfolio_external_id';
import * as migration_20260717_073201_visitor_logs from './20260717_073201_visitor_logs';
import * as migration_20260725_092709_gallery_order from './20260725_092709_gallery_order';
import * as migration_20260726_031114_seo_media_sizes from './20260726_031114_seo_media_sizes';
import * as migration_20260727_155330_portfolio_owner_feedback from './20260727_155330_portfolio_owner_feedback';

export const migrations = [
  {
    up: migration_20260703_092811_initial.up,
    down: migration_20260703_092811_initial.down,
    name: '20260703_092811_initial',
  },
  {
    up: migration_20260703_202158_blog_phase2_articles.up,
    down: migration_20260703_202158_blog_phase2_articles.down,
    name: '20260703_202158_blog_phase2_articles',
  },
  {
    up: migration_20260703_214240_add_article_published_at.up,
    down: migration_20260703_214240_add_article_published_at.down,
    name: '20260703_214240_add_article_published_at',
  },
  {
    up: migration_20260704_171630_portfolio_external_id.up,
    down: migration_20260704_171630_portfolio_external_id.down,
    name: '20260704_171630_portfolio_external_id',
  },
  {
    up: migration_20260717_073201_visitor_logs.up,
    down: migration_20260717_073201_visitor_logs.down,
    name: '20260717_073201_visitor_logs',
  },
  {
    up: migration_20260725_092709_gallery_order.up,
    down: migration_20260725_092709_gallery_order.down,
    name: '20260725_092709_gallery_order',
  },
  {
    up: migration_20260726_031114_seo_media_sizes.up,
    down: migration_20260726_031114_seo_media_sizes.down,
    name: '20260726_031114_seo_media_sizes',
  },
  {
    up: migration_20260727_155330_portfolio_owner_feedback.up,
    down: migration_20260727_155330_portfolio_owner_feedback.down,
    name: '20260727_155330_portfolio_owner_feedback'
  },
];
