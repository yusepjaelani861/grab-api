import express from 'express'
import GrabKusonime from '../controllers/kusonime'
import cache from '../middleware/cache'

const router = express.Router()

const duration_cache = 120 * 60

router.route('/list').get(cache(duration_cache), (new GrabKusonime()).getAnimeList)
router.route('/:slug').get((new GrabKusonime()).getPageInfo)

export default router