import { KinesisStreamRecord } from 'aws-lambda';
import fetch from 'node-fetch';

export const parser = (records: KinesisStreamRecord[]) : string[] => {

    const JSONstrings: string[] = [];
  
    for(const record of records){
      const booking = JSON.parse(atob(record.kinesis.data));
      if(booking.type === 'booking_completed'){
        const {booking_completed:{timestamp, product_provider, orderId}} = booking;
      
        JSONstrings.push(JSON.stringify({
          timestamp: new Date(timestamp).toISOString(),
          product_provider_buyer: product_provider,
          product_order_id_buyer: orderId
        }));
        
      }
    }
  
    return JSONstrings;
  }
  
  export const publish = async(url: string, data: string) => {
  
    const response = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: data
    });
  
    if(!response.ok){
      console.error('Error publishing data: ', response.statusText);
      return;
    }
  
    const success = await response.json();
    console.log(success);
  }