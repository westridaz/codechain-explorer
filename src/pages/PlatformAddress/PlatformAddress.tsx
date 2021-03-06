import * as QRCode from "qrcode.react";
import * as React from "react";
import { match } from "react-router";
import { Col, Container, Row } from "reactstrap";
import { Error } from "../../components/error/Error/Error";

import { BlockDoc, TransactionDoc } from "codechain-indexer-types";
import { U256 } from "codechain-sdk/lib/core/classes";
import BlockList from "../../components/block/BlockList/BlockList";
import AccountDetails from "../../components/platformAddress/AccountDetails/AccountDetails";
import { RequestPlatformAddressAccount, RequestTotalPlatformBlockCount } from "../../request";
import RequestPlatformAddressBlocks from "../../request/RequestPlatformAddressBlocks";

import CopyButton from "../../components/util/CopyButton/CopyButton";
import { ImageLoader } from "../../components/util/ImageLoader/ImageLoader";
import "./PlatformAddress.scss";

interface Props {
    match: match<{ address: string }>;
}

interface State {
    account?: {
        seq: U256;
        balance: U256;
    };
    blocks: BlockDoc[];
    transactions: TransactionDoc[];
    loadTransaction: boolean;
    loadBlock: boolean;
    pageForBlock: number;
    noMoreBlock: boolean;
    notFound: boolean;
    totalBlockCount: number;
}

class Address extends React.Component<Props, State> {
    private blockItemsPerPage = 6;
    constructor(props: Props) {
        super(props);
        this.state = {
            blocks: [],
            transactions: [],
            notFound: false,
            loadBlock: true,
            loadTransaction: true,
            pageForBlock: 1,
            noMoreBlock: false,
            totalBlockCount: 0
        };
    }

    public componentWillReceiveProps(props: Props) {
        const {
            match: {
                params: { address }
            }
        } = this.props;
        const {
            match: {
                params: { address: nextAddress }
            }
        } = props;
        if (nextAddress !== address) {
            this.setState({
                account: undefined,
                blocks: [],
                transactions: [],
                notFound: false,
                loadBlock: true,
                loadTransaction: true,
                noMoreBlock: false,
                totalBlockCount: 0
            });
        }
    }

    public render() {
        const {
            match: {
                params: { address }
            }
        } = this.props;
        const { account, blocks, notFound, loadBlock, pageForBlock, noMoreBlock, totalBlockCount } = this.state;
        if (notFound) {
            return (
                <div>
                    <Error content={address} title="The address does not exist." />
                </div>
            );
        }
        if (!account) {
            return (
                <RequestPlatformAddressAccount
                    address={address}
                    onAccount={this.onAccount}
                    onError={this.onError}
                    onAccountNotExist={this.onAccountNotExist}
                />
            );
        }
        return (
            <Container className="platform-address animated fadeIn">
                <Row>
                    <Col>
                        <div className="title-container d-flex">
                            <div className="d-inline-block left-container">
                                <ImageLoader size={65} data={address} isAssetImage={false} />
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
                    <RequestTotalPlatformBlockCount
                        address={address}
                        onTotalCount={this.onTotalBlockCount}
                        onError={this.onError}
                    />
                }
                {loadBlock ? (
                    <RequestPlatformAddressBlocks
                        page={pageForBlock}
                        itemsPerPage={this.blockItemsPerPage}
                        address={address}
                        onBlocks={this.onBlocks}
                        onError={this.onError}
                    />
                ) : null}
                {blocks.length > 0 ? (
                    <div className="mt-large">
                        <BlockList
                            blocks={blocks}
                            totalCount={totalBlockCount}
                            loadMoreAction={this.loadMoreBlock}
                            hideMoreButton={noMoreBlock}
                        />
                    </div>
                ) : null}
            </Container>
        );
    }
    private onBlocks = (blocks: BlockDoc[]) => {
        if (blocks.length < this.blockItemsPerPage) {
            this.setState({ noMoreBlock: true });
        }
        this.setState({
            blocks: this.state.blocks.concat(blocks),
            loadBlock: false
        });
    };
    private loadMoreBlock = () => {
        this.setState({
            loadBlock: true,
            pageForBlock: this.state.pageForBlock + 1
        });
    };
    private onTotalBlockCount = (totalCount: number) => {
        this.setState({ totalBlockCount: totalCount });
    };
    private onAccountNotExist = () => {
        this.setState({ notFound: true });
    };
    private onAccount = (account: { seq: U256; balance: U256 }) => {
        this.setState({ account });
    };
    private onError = (e: any) => {
        console.error(e);
    };
}

export default Address;
