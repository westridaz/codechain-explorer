import * as React from "react";
import { match } from "react-router";
import { Container, Row, Col } from "reactstrap";
import { Error } from "../../components/error/Error/Error";
import * as QRCode from "qrcode.react"

import { U256 } from "codechain-sdk/lib/core/classes"
import { RequestPlatformAddressAccount, RequestPlatformAddressParcels, RequestPlatformAddressAssets } from "../../request";
import RequestPlatformAddressBlocks from "../../request/RequestPlatformAddressBlocks";
import AccountDetails from "../../components/platformAddress/AccountDetails/AccountDetails";
import BlockList from "../../components/block/BlockList/BlockList";
import AssetList from "../../components/asset/AssetList/AssetList";
import ParcelList from "../../components/parcel/ParcelList/ParcelList";
import { ParcelDoc, AssetBundleDoc, BlockDoc } from "../../../db/DocType";

import "./PlatformAddress.scss"
import { ImageLoader } from "../../components/util/ImageLoader/ImageLoader";
import CopyButton from "../../components/util/CopyButton/CopyButton";

interface Props {
    match: match<{ address: string }>;
}

interface State {
    account?: {
        nonce: U256,
        balance: U256,
    },
    blocks: BlockDoc[],
    parcels: ParcelDoc[],
    assetBundles: AssetBundleDoc[],
    requested: boolean,
    notFound: boolean
}

class Address extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { blocks: [], parcels: [], assetBundles: [], requested: false, notFound: false };
    }

    public componentWillReceiveProps(props: Props) {
        const { match: { params: { address } } } = this.props;
        const { match: { params: { address: nextAddress } } } = props;
        if (nextAddress !== address) {
            this.setState({ account: undefined, blocks: [], parcels: [], requested: false, notFound: false });
        }
    }

    public render() {
        const { match: { params: { address } } } = this.props;
        const { account, blocks, assetBundles, parcels, requested, notFound } = this.state;
        if (notFound) {
            return (
                <div>
                    <Error content={address} title="The address does not exist." />
                </div>
            )
        }
        if (!account) {
            return <RequestPlatformAddressAccount address={address} onAccount={this.onAccount} onError={this.onError} onAccountNotExist={this.onAccountNotExist} />;
        }
        if (!requested) {
            return (
                <div>
                    <RequestPlatformAddressBlocks address={address} onBlocks={this.onBlocks} onError={this.onError} />
                    <RequestPlatformAddressParcels address={address} onParcels={this.onParcels} onError={this.onError} />
                    <RequestPlatformAddressAssets address={address} onAssetBundles={this.onAssetBundles} onError={this.onError} />
                </div>
            )
        }
        return (
            <Container className="platform-address">
                <Row>
                    <Col>
                        <div className="title-container d-flex">
                            <div className="d-inline-block left-container">
                                <ImageLoader size={65} data={address} />
                            </div>
                            <div className="d-inline-block right-container">
                                <h1>Platform Address</h1>
                                <div className="hash-container d-flex">
                                    <div className="d-inline-block hash">
                                        <span>{address}</span>
                                    </div>
                                    <CopyButton className="d-inline-block" copyString={address} />
                                </div>
                            </div>
                            <div className="d-inline-block qrcode-container">
                                <QRCode size={65} value={address} />
                            </div>
                        </div>
                    </Col>
                </Row>
                <div className="big-size-qr text-center">
                    <QRCode size={120} value={address} />
                </div>
                <div className="mt-large">
                    <AccountDetails account={account} />
                </div>
                {
                    assetBundles.length > 0 ?
                        <div className="mt-large">
                            <AssetList assetBundles={assetBundles} totalCount={assetBundles.length} />
                        </div>
                        : null
                }
                {
                    parcels.length > 0 ?
                        <div className="mt-large">
                            <ParcelList address={address} parcels={parcels} totalCount={parcels.length} />
                        </div>
                        : null
                }
                {
                    blocks.length > 0 ?
                        <div className="mt-large">
                            <BlockList blocks={blocks} totalCount={blocks.length} />
                        </div>
                        : null
                }
            </Container>
        )
    }
    private onParcels = (parcels: ParcelDoc[]) => {
        this.setState({ parcels });
    }
    private onAssetBundles = (assetBundles: AssetBundleDoc[]) => {
        this.setState({ assetBundles });
    }
    private onBlocks = (blocks: BlockDoc[]) => {
        this.setState({ blocks });
        this.setState({ requested: true });
    }
    private onAccountNotExist = () => {
        this.setState({ notFound: true });
    }
    private onAccount = (account: { nonce: U256, balance: U256 }) => {
        this.setState({ account });
    }
    private onError = (e: any) => { console.error(e); }
}

export default Address;
