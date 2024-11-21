import { KinesisStreamEvent, KinesisStreamRecord } from 'aws-lambda';
import {parser, publish } from './helpers';

export const handler = (
  event: KinesisStreamEvent,
  parserFn: (records: KinesisStreamRecord[]) => string[] = parser,
  publishFn: (url: string, booking: string) => void = publish
) => {

  const publishURL = process.env.PUBLISH_URL;

  if(!publishURL){
    console.error('No PUBLISH_URL defined as environment variable.');
    return;
  }
  
  const bookings = parserFn(event.Records);

  for(const booking of bookings){
    publishFn(publishURL, booking);
  }
  
};

