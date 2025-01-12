import { MetaFunction } from '@remix-run/node';
import { useEffect, useState } from 'react';
import { getRawTweets, getSummery } from '~/common/api.request';
import { Input, Flex, Select, Space, DatePicker, Button, Modal,Spin } from 'antd';
import CustomTable from '~/components/Table';
import { useLoaderData } from '@remix-run/react';
import dayjs from 'dayjs';

interface Tweet {
  cashtags: string[];
  text: string;
  createdAt: string;
  username: string;
  tweetId: string;
  qualityScore: number;
  type: string;
}

interface Filters {
  date: string | null;
  username: string;
  cashtag: string;
}

export const meta: MetaFunction = () => {
  return [
    { title: 'Twitter Scrapper' },
    { name: 'description', content: 'Welcome to Remix!' },
  ];
};

export default function Index() {
  const [data, setData] = useState<Tweet[]>([]);
  const [filteredData, setFilteredData] = useState<Tweet[]>([]);
  const [openSummeryModal,setOpenSummeryModal] = useState<boolean>()
  const [username,setUsername] = useState<string>("")
  const [cashtag,setCashtag] = useState<string>("")
  const [filters, setFilters] = useState({
    date: null,
    username: 'All',
    cashtag: '',
  });
  
  const [isFilterChanged, setIsFilterChanged] = useState(false);

  const tweets =  useLoaderData<{ tweets: { tweets: Tweet[] }[] }>();

  const allTweets = tweets?.tweets?.flatMap((entry) =>
    entry.tweets.map((tweet) => ({
      cashtags: tweet.cashtags,
      text: tweet.text,
      createdAt: tweet.createdAt,
      username: tweet.username,
      tweetId: tweet.tweetId,
      qualityScore: tweet.qualityScore,
      type: tweet.type,
    }))
  );

  const sortedTweets = allTweets.sort((a, b) => dayjs(b.createdAt).diff(dayjs(a.createdAt)));


  useEffect(() => {
    setData(sortedTweets);
    setFilteredData(sortedTweets);
  }, []);
  
 useEffect(() => {
    setIsFilterChanged(JSON.stringify(filteredData) !== JSON.stringify(data));
  }, [filteredData, data]);

  const handleFilterChange = (key: keyof Filters, value: string | null) => {
    // Update the filter state
    setFilters((prevFilters) => {
      const updatedFilters = { ...prevFilters, [key]: value };
  
      const filtered = sortedTweets.filter((tweet) => {
        const matchesDate =
          !updatedFilters.date || dayjs(tweet.createdAt).isSame(updatedFilters.date, 'day');
        const matchesUsername =
          updatedFilters.username === 'All' || tweet.username === updatedFilters.username;
        const matchesCashtag =
          !updatedFilters.cashtag ||
          tweet.cashtags.some((tag) =>
            tag.toLowerCase().includes(updatedFilters.cashtag.toLowerCase())
          );
  
        return matchesDate && matchesUsername && matchesCashtag; 
      });
  
   
      setFilteredData(filtered);
  
      return updatedFilters; 
    });
  };
  

  const handleSummery = async() => {
    setOpenSummeryModal(true)
    const result = await getSummery(filteredData,username,cashtag)
  }

  

  // Get unique usernames for the username filter dropdown
  const uniqueUsernames:string[] = [...new Set(sortedTweets?.map((tweet :any) => tweet.username))];

  return (
    <>
      <div className="px-5 py-2">
        <Flex gap={100}>
          <div>
            <Space size={20}>
              <div>
                <h1 className="font-semibold text-sm">Date</h1>
                <DatePicker
                  onChange={(date) => handleFilterChange('date', date ? date.toISOString() : null)}
                />
              </div>
              <div>
                <h1 className="font-semibold text-sm">Username</h1>
                <Select
                  defaultValue="All"
                  onChange={(value) => handleFilterChange('username', value)}
                  style={{ width: 200 }}
                >
                  <Select.Option value="All">All</Select.Option>
                  {uniqueUsernames?.map((username) => (
                    <Select.Option key={username} value={username}>
                      {username}
                    </Select.Option>
                  ))}
                </Select>
              </div>
              <div>
                <h1 className="font-semibold text-sm">Cashtag</h1>
                  <Input
                    placeholder="Search cashtag"
                    onChange={(e) => handleFilterChange('cashtag', e.target.value)}
                  />
              </div>
              <div>
                <h1 className="font-semibold text-sm">Summerize</h1>
                 <Button type='primary' disabled={!isFilterChanged} onClick={handleSummery}>Get Summery</Button>
              </div>
            </Space>
          </div>
        </Flex>
        <div className="mt-2">
          <CustomTable tweets={filteredData} />
        </div>
      </div>
      <Modal width={800} open={openSummeryModal} onCancel={() => setOpenSummeryModal(false)} footer={<Button onClick={() => setOpenSummeryModal(false)}>Close</Button>}>
        <Flex justify='center' className='h-[60vh]' align='center'>
        <Spin/>
        </Flex>
        </Modal>
    </>
  );
}

export async function loader() {
  const res = await getRawTweets();
  return res;
}
