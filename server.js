const express = require('express');
const axios = require('axios');
const _ = require('lodash');

const app = express();
const PORT = 3000;
const CACHE_TIME = 60000;  // Set Cache period(milliseconds)

const fetchBlogData = async (req, res) => {
    try {

        const response = await axios.get('https://intent-kit-16.hasura.app/api/rest/blogs', {
            headers: {
                'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Unable to fetch Blogs!' });
    }
};

const memoizedBlogStats = _.memoize((blogData) => {
    // Total number of blogs
    totalBlogs = _.size(blogData.blogs);

    // Blog with the longest title
    longestTitle = _.maxBy(blogData.blogs, 'title.length');

    // Blogs containing the word privacy
    blogsContainingPrivacy = _.filter(blogData.blogs, blog => _.includes(blog.title.toLowerCase(), 'privacy'));

    // unique blog titles
    uniqueBlogTitles = _.uniqBy(blogData.blogs, 'title').map(blog => blog.title);

    return {
        totalBlogs: totalBlogs,
        blogWithLongestTitle: longestTitle.title,
        blogsContainingPrivacy: blogsContainingPrivacy,
        blogsWithUniqueTitles: uniqueBlogTitles,
    }
},(blogData) => 'blogStats', CACHE_TIME);

const memoizedBlogSearch = _.memoize((blogData, query) => {
    if (query) {
        filteredBlogs = _.filter(blogData.blogs, blog => blog.title.toLowerCase().includes(query.toLowerCase())
        );
    }
    return { filteredBlogs };
}, (blogData, query) => JSON.stringify(blogData) + query, CACHE_TIME);


app.get('/', (res) => {
    res.send('Hello World!');
});

// For testing purpose only, Do not use this endpoint
app.get('/api/blogs', async (req, res) => {
    try {
        const blogData = await fetchBlogData();
        res.json(blogData);
    }
    catch (error) {
        console.error('Error fetching blog data:', error);
        res.status(500).json({ error: 'Unable to fetch Blogs!' });
    } 
});

app.get('/api/blog-stats', async (req, res) => {
    try {
        const blogData = await fetchBlogData();
        const blogStats = memoizedBlogStats(blogData);
        res.json(blogStats);
    } catch (error) {
        console.error('Error fetching blog data:', error);
        res.status(500).json({ error: 'Error finding stats!' });
    }
})

app.get('/api/blog-search', async (req, res) => {

    // query string
    const query = req.query.query;

    try {
        const blogData = await fetchBlogData();
        const filteredBlogs = memoizedBlogSearch(blogData, query);
        res.json(filteredBlogs);
    } catch (error) {
        console.error('Error fetching blog data:', error);
        res.status(500).json({ error: 'Please provide search parameter!' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
