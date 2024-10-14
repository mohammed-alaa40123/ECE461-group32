import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class S3BucketCreate extends cdk.Stack {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define your S3 bucket
    this.bucket = new s3.Bucket(this, 'CdkTestBucket', {
      versioned: true,
      bucketName: id,
      publicReadAccess: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
