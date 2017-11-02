/**

MIT License

Copyright (c) 2017 Moustacheminer Server Services

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

const express = require('express');
const r = require('./db');

const router = express.Router();

const authMiddleware = async (req, res, next) => {
	const auth = req.get('Authorization');

	const bot = await r.table('bots')
		.get(req.params.id)
		.run(r.conn);

	if (!bot) {
		res.status(404).json({ error: 'This bot doesn\'t exist' });
	} else if (auth === bot.token) {
		next();
	} else {
		res.status(401).json({ error: 'Incorrect Authorisation header.' });
	}
};

router.get('/', (req, res) => {
	res.redirect('/docs/api');
})
	.get('/bots', async (req, res) => {
		const cursor = await r.table('bots')
			.without('token')
			.run(r.conn);
		const result = await cursor.toArray();
		res.status(200).send(result);
	})
	.get('/bots/:id', (req, res) => {
		const result = r.table('bots')
			.get(req.params.id)
			.without('token')
			.run(r.conn);

		if (!result) {
			res.status(404).json({});
		} else {
			res.status(200).json(result);
		}
	})
	.post('/bots/:id', authMiddleware, async (req, res) => {
		const count = parseInt(req.body.count || req.body.server_count, 10);
		if (typeof count !== 'string' && typeof count !== 'number') {
			res.status(400).json({ error: 'You provided an invalid guild count' });
		} else if (count < 0) {
			res.status(400).json({ error: 'Your bot count was too low (0)' });
		} else if (count > 1000000) {
			res.status(400).json({ error: 'Your bot count was too high (1000000)' });
		} else {
			await r.table('bots')
				.get(req.params.id)
				.update({ count })
				.run(r.conn);
			res.status(200).json({ message: 'OK' });
		}
	})
	.use('/test/:id', authMiddleware, (req, res) => {
		res.status(200).json({ message: 'OK' });
	})
	.use('*', (req, res) => {
		res.status(404).json({ error: 'This API method has not been defined.' });
	});

module.exports = router;
