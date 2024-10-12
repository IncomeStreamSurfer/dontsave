import { useState, useCallback } from 'react';
import { Page, Layout, Button, TextField, Banner } from '@shopify/polaris';
import { useAppBridge } from '@shopify/app-bridge-react';
import { getSessionToken } from '@shopify/app-bridge-utils';
import axios from 'axios';

export default function Index() {
  const [businessName, setBusinessName] = useState('');
  const [businessInfo, setBusinessInfo] = useState('');
  const [status, setStatus] = useState('');
  const app = useAppBridge();

  const handleScan = useCallback(async () => {
    setStatus('Processing...');
    const token = await getSessionToken(app);
    try {
      await axios.post('/api/scan-products', { businessName, businessInfo }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus('Products scanned and tagged successfully');
    } catch (error) {
      console.error('Error scanning products:', error);
      setStatus('Error scanning products');
    }
  }, [app, businessName, businessInfo]);

  const handleGenerateCollections = useCallback(async () => {
    setStatus('Generating collections...');
    const token = await getSessionToken(app);
    try {
      await axios.post('/api/generate-collections', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatus('Collections generated successfully');
    } catch (error) {
      console.error('Error generating collections:', error);
      setStatus('Error generating collections');
    }
  }, [app]);

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <TextField
            label="Business Name"
            value={businessName}
            onChange={setBusinessName}
          />
          <TextField
            label="Business Information"
            value={businessInfo}
            onChange={setBusinessInfo}
            multiline={4}
          />
          <Button onClick={handleScan}>Scan Products and Generate Tags</Button>
          <Button onClick={handleGenerateCollections}>Generate Collections</Button>
          {status && <Banner status="info">{status}</Banner>}
        </Layout.Section>
      </Layout>
    </Page>
  );
}
