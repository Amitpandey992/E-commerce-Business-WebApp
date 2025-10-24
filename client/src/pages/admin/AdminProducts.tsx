import React, { useEffect, useMemo, useState } from "react";
import { FaArrowDown, FaArrowUp, FaEdit, FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
    Cell,
    Column,
    ColumnInstance,
    HeaderGroup,
    Row,
    useSortBy,
    useTable,
} from "react-table";

type CustomColumn<T extends object> = Column<T> & {
    disableSortBy?: boolean;
};
import Pagination from "../../components/common/Pagination";
import SkeletonLoader from "../../components/common/SkeletonLoader";
import { useAllProductsQuery } from "../../redux/api/product.api";
import { CustomError, Product } from "../../types/api-types";
import { notify } from "../../utils/util";

const AdminProducts: React.FC = () => {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [sortBy, setSortBy] = useState<{ id: string; desc: boolean }>({
        id: "",
        desc: false,
    });
    const {
        data: productsData,
        isLoading,
        isError,
        error,
        refetch,
    } = useAllProductsQuery({ page, limit, sortBy });
    const [data, setData] = useState<Product[]>([]);

    useEffect(() => {
        if (productsData?.products) {
            setData(productsData.products);
        }
    }, [productsData]);

    useEffect(() => {
        if (isError && error) {
            const err = error as CustomError;
            notify(
                err?.data?.message ||
                    (err as any)?.message ||
                    "Failed to load products",
                "error"
            );
        }
    }, [isError, error]);

    const columns = useMemo<Column<Product>[]>(
        () => [
            {
                Header: "Image",
                accessor: "photo",
                Cell: ({ value }: { value: string }) => (
                    <img
                        src={value}
                        alt="product"
                        className="w-16 h-16 object-cover rounded"
                    />
                ),
                disableSortBy: true,
            },
            { Header: "Product", accessor: "name" },
            { Header: "Category", accessor: "category" },
            { Header: "Stock", accessor: "stock" },
            { Header: "Price", accessor: "price" },
            {
                Header: "Actions",
                Cell: ({ row }: { row: Row<Product> }) => (
                    <button
                        onClick={() =>
                            navigate(`/admin/products/${row.original._id}`)
                        }
                        className="text-blue-600 hover:text-blue-800 flex items-center"
                    >
                        <FaEdit className="mr-2" /> Manage
                    </button>
                ),
                disableSortBy: true,
            },
        ],
        [navigate]
    );

    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
        useTable<Product>({ columns, data }, useSortBy);

    const handleSort = (columnId: string) => {
        setSortBy((prevSortBy) => {
            if (prevSortBy.id === columnId) {
                return { id: columnId, desc: !prevSortBy.desc };
            } else {
                return { id: columnId, desc: false };
            }
        });
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    const handleRetry = () => {
        refetch();
    };

    if (isLoading) {
        return (
            <div className="bg-white p-6 rounded-md shadow-sm">
                <SkeletonLoader
                    rows={5}
                    columns={10}
                    height={40}
                    className="mb-4"
                />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="bg-white p-6 rounded-md shadow-sm text-center">
                <p className="text-red-500 mb-4">
                    Failed to load products. Please try again.
                </p>
                <button
                    onClick={handleRetry}
                    className="flex items-center text-white bg-blue-600 px-4 py-2 rounded-md hover:bg-blue-700 transition"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-md shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Products</h2>
                <div className="flex items-center">
                    <button
                        onClick={() => navigate("/admin/products/new")}
                        className="flex items-center text-white bg-blue-600 px-4 py-2 rounded-md hover:bg-blue-700 transition mr-2"
                    >
                        <FaPlus className="mr-2" /> Add Product
                    </button>
                </div>
            </div>
            {data.length === 0 ? (
                <div className="text-center text-gray-500">
                    No products available.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table
                        {...getTableProps()}
                        className="w-full text-left border-collapse"
                    >
                        <thead className="bg-gray-100">
                            {headerGroups.map(
                                (
                                    headerGroup: HeaderGroup<Product>,
                                    headerGroupIndex
                                ) => {
                                    const {
                                        key: headerGroupKey,
                                        ...headerGroupProps
                                    } = headerGroup.getHeaderGroupProps();
                                    return (
                                        <tr
                                            key={headerGroupIndex}
                                            {...headerGroupProps}
                                        >
                                            {headerGroup.headers.map(
                                                (column, columnIndex) => {
                                                    const colInstance =
                                                        column as ColumnInstance<Product>;
                                                    const sortToggleProps =
                                                        typeof (
                                                            colInstance as any
                                                        )
                                                            .getSortByToggleProps ===
                                                        "function"
                                                            ? (
                                                                  colInstance as any
                                                              ).getSortByToggleProps()
                                                            : {};
                                                    const {
                                                        key: columnKey,
                                                        ...restHeaderProps
                                                    } =
                                                        colInstance.getHeaderProps(
                                                            sortToggleProps as any
                                                        );
                                                    return (
                                                        <th
                                                            key={columnIndex}
                                                            {...restHeaderProps}
                                                            className={`p-2 border-b cursor-pointer ${
                                                                (
                                                                    colInstance as any
                                                                ).isSorted
                                                                    ? "bg-blue-50"
                                                                    : ""
                                                            }`}
                                                            onClick={() =>
                                                                !(
                                                                    colInstance as CustomColumn<Product>
                                                                )
                                                                    .disableSortBy &&
                                                                handleSort(
                                                                    colInstance.id
                                                                )
                                                            }
                                                        >
                                                            <div className="flex items-center">
                                                                {colInstance.render(
                                                                    "Header"
                                                                )}
                                                                {(
                                                                    colInstance as any
                                                                ).isSorted ? (
                                                                    (
                                                                        colInstance as any
                                                                    )
                                                                        .isSortedDesc ? (
                                                                        <FaArrowDown className="ml-2 text-blue-600" />
                                                                    ) : (
                                                                        <FaArrowUp className="ml-2 text-blue-600" />
                                                                    )
                                                                ) : (
                                                                    ""
                                                                )}
                                                            </div>
                                                        </th>
                                                    );
                                                }
                                            )}
                                        </tr>
                                    );
                                }
                            )}
                        </thead>

                        <tbody {...getTableBodyProps()}>
                            {rows.map((row: Row<Product>, rowIndex) => {
                                prepareRow(row);
                                const { key, ...restRowProps } =
                                    row.getRowProps();
                                return (
                                    <tr
                                        key={rowIndex}
                                        {...restRowProps}
                                        className="hover:bg-gray-50"
                                    >
                                        {row.cells.map(
                                            (
                                                cell: Cell<Product>,
                                                cellIndex
                                            ) => {
                                                const {
                                                    key: cellKey,
                                                    ...restCellProps
                                                } = cell.getCellProps();
                                                return (
                                                    <td
                                                        key={cellIndex}
                                                        {...restCellProps}
                                                        className="p-2 border-b"
                                                    >
                                                        {cell.render("Cell")}
                                                    </td>
                                                );
                                            }
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            <div className="mt-4">
                <Pagination
                    totalPages={productsData?.totalPages}
                    currentPage={productsData?.currentPage}
                    onPageChange={handlePageChange}
                />
            </div>
        </div>
    );
};

export default AdminProducts;
