import { KinesisStreamRecord } from 'aws-lambda';
import * as helpers from 'src/helpers';
import {handler} from 'src/index';

describe('handler test', () => {
  
  let publishURL: string | undefined;

  beforeEach(()=> {
    publishURL = process.env.PUBLISH_URL;
    process.env.PUBLISH_URL = "localhost:3000";
  });

  afterEach(() => {
    process.env.PUBLISH_URL = publishURL;
    vi.clearAllMocks();  
    vi.restoreAllMocks();  
  });

  
  it('Empty or missing environment variable should log error and return early', () => {
      delete process.env.PUBLISH_URL;
      const parserSpy = vi.spyOn(helpers, 'parser').mockReturnValue([])  as unknown as (records: KinesisStreamRecord[]) => string[];;
      const consoleError = vi.spyOn(console, 'error');

      handler({Records: []});

      expect(consoleError).toBeCalledWith('No PUBLISH_URL defined as environment variable.')
      expect(parserSpy).toBeCalledTimes(0);
  });

  it('Handler does not publish anything for empty records', () => {
    const parserSpy = vi.spyOn(helpers, 'parser').mockReturnValue([])  as unknown as (records: KinesisStreamRecord[]) => string[];
    const publishSpy = vi.spyOn(helpers, 'publish') as unknown as (url:string, booking:string) => void;

    handler({Records: []}, parserSpy, publishSpy);
    
    expect(parserSpy).toBeCalled();
    expect(publishSpy).toBeCalledTimes(0);
    expect(parserSpy).toHaveBeenCalledWith([]);
  });

  it('Handler should call publish with data from return of parser', () => {
    const publishSpy = vi.spyOn(helpers, 'publish').mockImplementation(() => Promise.resolve()) as unknown as (url:string, booking:string) => void;
    const parserSpy = vi.spyOn(helpers, 'parser').mockReturnValue(['test-data']) as unknown as (records: KinesisStreamRecord[]) => string[];

    handler({Records: []}, parserSpy, publishSpy);

    expect(publishSpy).toBeCalledWith(expect.any(String), 'test-data');

  });

  it('Handler should not call publish for empty return from parser', () => {
    const publishSpy = vi.spyOn(helpers, 'publish').mockImplementation(() => Promise.resolve()) as unknown as (url:string, booking:string) => void;
    const parserSpy = vi.spyOn(helpers, 'parser').mockReturnValue([]) as unknown as (records: KinesisStreamRecord[]) => string[];
  
    handler({Records: []}, parserSpy, publishSpy);

    expect(publishSpy).toBeCalledTimes(0);

  });


});

describe('parser test', () => {

  it('parser should return empty array for empty records', () => {
      const result = helpers.parser([]);
      expect(result).toStrictEqual([]);
  });

  it('parser should properly parse booking_completed records', () => {
    const mockRecord = {
      kinesis: { data: btoa(JSON.stringify({ type: 'booking_completed', booking_completed: {
      timestamp: 1631538059459,
      orderId: 10017,
      product_provider: 'Stena Line'
    }}))}
    } as KinesisStreamRecord;

    const result = helpers.parser([mockRecord]);
    
    expect(result).toEqual([JSON.stringify({
      timestamp: new Date(1631538059459).toISOString(),
      product_provider_buyer: 'Stena Line',
      product_order_id_buyer: 10017
    })]);
  });

  it('parser should parse booking_completed records in a mixed array', () => {
    const mockBookingComplete = {
      kinesis: { data: btoa(JSON.stringify({ type: 'booking_completed', booking_completed: {
      timestamp: 1631538059459,
      orderId: 10017,
      product_provider: 'Stena Line'
    }}))}
    } as KinesisStreamRecord;

    const mockBookingRequest = {
      kinesis: { data: btoa(JSON.stringify({ type: 'booking_request'}))}
    } as KinesisStreamRecord;

    const result = helpers.parser([mockBookingComplete, mockBookingRequest]);
    
    expect(result).toEqual([JSON.stringify({
      timestamp: new Date(1631538059459).toISOString(),
      product_provider_buyer: 'Stena Line',
      product_order_id_buyer: 10017
    })]);
  })

  
  it('parser should return empty array for valid records that are not booking_completed', () => {
 
    const mockBookingRequest = {
      kinesis: { data: btoa(JSON.stringify({ type: 'booking_request'}))}
    } as KinesisStreamRecord;

    const result = helpers.parser([mockBookingRequest]);
    
    expect(result).toEqual([]);
  })

});