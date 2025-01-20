/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/no-unresolved */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
import { Table, Spin, Flex, Button, Drawer } from 'antd';
import { useEffect, useState } from 'react';
import { getCashtags, getSummaryForCashtag,getCashtagTweets } from '~/common/api.request';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const analysis = () => {
  const [cashtags, setCashtags] = useState<any[]>([]);
  const [tableData, setTableData] = useState<{ tableData: any[]; columns: any[] } | null>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [selectedCashtag, setSelectedCashtag] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isLoadingcashtag, setIsLoadingcashtag] = useState<boolean>(false);
  const [summaryText, setSummaryText] = useState<string>('');
  const [cashtagTweets, setCashtagTweets] = useState<any[]>();
  const [showTweets,setShowTweets] = useState<boolean>(false);
  const [tweetText,setTweetText] = useState<Array<{content: string, url: string}>>([]);

  const getData = async () => {
    try {
      setIsLoadingcashtag(true);
      const data = await getCashtags();
      const tweets = await getCashtagTweets();
      setCashtagTweets(tweets);
      setCashtags([data]);
    } catch (error) {
      console.error('Error fetching cashtags:', error);
    } finally {
      setIsLoadingcashtag(false);
    }
  };

  const handleClick = async (cashtag: string) => {
    setSelectedCashtag(cashtag);
    setOpen(true);
    setLoading(true);
    try {
      const result = await getSummaryForCashtag(cashtag);
      setSummaryText(result);
    } catch (error) {
      console.error('Error fetching summary:', error);
      setSummaryText('Failed to load summary. Please try again.');
    } finally {
      setLoading(false);
    }
  };
 
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });
    return `${day} ${month}`;
  };

  const generateTableData = (
    data: any[],
    avgCashtagData: { cashtag: string; avg: number; stdDev: number }[]
  ): { tableData: any[]; columns: any[] } => {
    const avgCashtagMap = avgCashtagData.reduce((acc, item) => {
      acc[item.cashtag] = { avg: item.avg, stdDev: item.stdDev };
      return acc;
    }, {} as Record<string, { avg: number; stdDev: number }>);
  
    const uniqueDates = Array.from(new Set((data || []).map((item) => item.date))).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );
  
    // Map cashtags to their tweets
    const cashtagTweetMap: Record<string, Array<{content: string, url: string}>> = (cashtagTweets || []).reduce(
      (acc, tweet) => {
        (tweet.cashtags || []).forEach((cashtag: string) => {
          if (!acc[cashtag]) {
            acc[cashtag] = [];
          }
          acc[cashtag].push({
            content: `@${tweet.username}\n\n${tweet.text || 'No content available'}`,
            url: `https://x.com/${tweet.username}/status/${tweet.tweetId}`
          });
        });
        return acc;
      },
      {}
    );
  
    // Group data by cashtag and map counts to dates
    const groupedData: Record<
      string,
      { cashtag: string; dateCounts: Record<string, number>; avg: number; stdDev: number; tweets: Array<{content: string, url: string}> }
    > = data.reduce((acc, item) => {
      const { cashtag, date, count } = item;
  
      if (!acc[cashtag]) {
        const stats = avgCashtagMap[cashtag] || { avg: 0, stdDev: 0 };
        acc[cashtag] = {
          cashtag,
          dateCounts: {},
          avg: stats.avg,
          stdDev: stats.stdDev,
          tweets: cashtagTweetMap[cashtag] || [],
        };
      }
  
      acc[cashtag].dateCounts[date] = (acc[cashtag].dateCounts[date] || 0) + (count || 0);
  
      return acc;
    }, {});
  
    // Prepare table data
    const tableData = Object.values(groupedData || {}).map((entry) => {
      const { cashtag, dateCounts, avg, stdDev, tweets } = entry;
  
      return {
        cashtag,
        avg: avg.toFixed(2),
        stdDev: stdDev.toFixed(2),
        tweets,
        ...uniqueDates.reduce((acc, date) => {
          acc[date] = dateCounts[date] || 0;
          return acc;
        }, {}),
      };
    });
  
    const columns = [
      {
        title: 'Cashtag',
        dataIndex: 'cashtag',
        key: 'cashtag',
        fixed: 'left',
        width: 110,
      },
      ...(uniqueDates || []).map((date) => ({
        title: formatDate(date),
        dataIndex: date,
        key: date,
        width: 100,
        sorter: (a: any, b: any) => a[date] - b[date],
      })),
      {
        title: 'Avg',
        dataIndex: 'avg',
        key: 'avg',
        width: 100,
      },
      {
        title: 'Std Dev',
        dataIndex: 'stdDev',
        key: 'stdDev',
        width: 100,
      },
      {
        title: 'Tweets',
        dataIndex: 'tweets',
        key: 'tweets',
        render: (tweets: Array<{content: string, url: string}>) => (
          <Button
            disabled={tweets.length === 0}
            type="link"
            onClick={() => handleShowTweets(tweets)}
          >
            {tweets.length === 0 ? 'No tweets' : 'Show Tweets'}
          </Button>
        ),
      },
      {
        title: 'Summary',
        dataIndex: 'summary',
        key: 'summary',
        render: (_: any, record: any) => (
          <Button onClick={() => handleClick(record.cashtag)} type="link">
            Get Summary
          </Button>
        ),
      },
    ];
  
    return { tableData, columns };
  };
  
  useEffect(() => {
    getData();
  }, []);

  useEffect(() => {
    if (cashtags.length > 0) {
      const generatedTableData = generateTableData(cashtags[0].sevenDaysdata, cashtags[0].avgCashtagData);

      setTableData({
        ...generatedTableData,
        tableData: generatedTableData.tableData.sort(
          (a, b) => b[Object.keys(b)[1]] - a[Object.keys(a)[1]]
        ),
      });
    }
  }, [cashtags, cashtagTweets]);

  const handleShowTweets = (tweets: Array<{content: string, url: string}>) => {
    setShowTweets(true);
    setTweetText(tweets);
  };

  return (
    <div className="w-full px-5 pt-2">
      {!isLoadingcashtag ? (
        <>
          {tableData && (
            <Table
              dataSource={(tableData.tableData || []).map((item, index) => ({ key: index, ...item }))}
              columns={tableData.columns}
              pagination={false}
              scroll={{ x: 1000 }}
              bordered
              className="shadow-lg"
            />
          )}
        </>
      ) : (
        <Flex justify="center" align="center" className="h-96">
          <Spin size="large" />
        </Flex>
      )}
      <Drawer
        title={`Summary for ${selectedCashtag || ''}`}
        width={700}
        onClose={() => setOpen(false)}
        open={open}
        styles={{
          body: {
            padding: '24px',
            background: '#f8fafc',
          },
        }}
      >
        <Flex justify="center" className="p-4" align="center">
          {loading ? (
            <Spin size="large" className="mt-64" />
          ) : (
            <div className=" bg-white p-6 rounded-lg shadow">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{summaryText}</ReactMarkdown>
            </div>
          )}
        </Flex>
      </Drawer>
      <Drawer
        title="Tweets"
        width={800}
        onClose={() => setShowTweets(false)}
        open={showTweets}
        styles={{
          body: {
            padding: '24px',
            background: '#f8fafc',
          },
        }}
      >
        <Table 
          dataSource={tweetText.map((tweet, index) => ({
            key: index,
            ...tweet
          }))}
          columns={[
            {
              title: 'Tweet Content',
              dataIndex: 'content',
              key: 'content',
              width: '70%',
              render: (content: string) => (
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{content?.split('\n\n')[0]}</div>
                  {content?.split('\n\n')?.slice(1)?.join('\n\n')}
                </div>
              )
            },
            {
              title: 'Link',
              dataIndex: 'url',
              key: 'url',
              render: (url: string) => (
                <a className='text-blue-500' href={url} target="_blank" rel="noopener noreferrer">
                  View Tweet
                </a>
              )
            }
          ]}
          pagination={false}
          className="shadow-lg"
        />
      </Drawer>
    </div>
  );
};

export default analysis;
